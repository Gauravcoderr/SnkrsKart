import json
import random

import joblib
import lightgbm as lgb
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import GroupKFold, GroupShuffleSplit

from corpus import DATA, MODELS, normalize, our_blog_chunks, read_jsonl
from train_data import clean_pair
from features import FEATURE_NAMES, extract


def oof_scores(X_feat, X_text, y, groups):
    oof = np.zeros(len(y))
    for tr, te in GroupKFold(n_splits=5).split(X_feat, y, groups):
        g = lgb.LGBMClassifier(n_estimators=400, learning_rate=0.04, num_leaves=15, min_child_samples=20,
                               subsample=0.8, subsample_freq=1, colsample_bytree=0.8, verbose=-1)
        g.fit(X_feat[tr], y[tr])
        v = TfidfVectorizer(ngram_range=(1, 2), min_df=3, max_features=60000, sublinear_tf=True)
        l = LogisticRegression(C=2.0, max_iter=2000).fit(v.fit_transform([X_text[i] for i in tr]), y[tr])
        oof[te] = 0.5 * g.predict_proba(X_feat[te])[:, 1] + 0.5 * l.predict_proba(v.transform([X_text[i] for i in te]))[:, 1]
    return oof


def build():
    rows = []
    for name in ("pairs.jsonl", "pairs_claude.jsonl", "pairs_ours.jsonl"):
        for p in read_jsonl(DATA / name):
            if not clean_pair(p["ai"], p["human"]):
                continue
            group = "ours:" + p["slug"] if name == "pairs_ours.jsonl" else p["url"]
            subset = "ours_humanlike" if name == "pairs_ours.jsonl" else "human"
            ai_subset = "claude" if name == "pairs_claude.jsonl" else "local_llm"
            rows.append({"text": p["human"], "y": 0, "group": group, "subset": subset})
            rows.append({"text": p["ai"], "y": 1, "group": group, "subset": ai_subset})
    return rows


def ours_eval(gbm, vec, lr):
    chunks = our_blog_chunks()
    if not chunks:
        return {}
    f = np.array([extract(c["text"]) for c in chunks], dtype=float)
    p = 0.5 * gbm.predict_proba(f)[:, 1] + 0.5 * lr.predict_proba(vec.transform([normalize(c["text"]) for c in chunks]))[:, 1]
    return {"ours_chunk_p50": round(float(np.percentile(p, 50)), 4), "ours_chunk_p90": round(float(np.percentile(p, 90)), 4),
            "ours_share_above_threshold": None, "_scores": p}


def main():
    rows = build()
    y = np.array([r["y"] for r in rows])
    groups = np.array([r["group"] for r in rows])
    subsets = np.array([r["subset"] for r in rows])
    X_feat = np.array([extract(r["text"]) for r in rows], dtype=float)
    X_text = [normalize(r["text"]) for r in rows]
    print(f"rows={len(rows)} human={int((y == 0).sum())} ai={int(y.sum())} "
          f"local_llm={int((subsets == 'local_llm').sum())} our_blogs={int((subsets == 'our_blogs').sum())}")

    tr, te = next(GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=11).split(X_feat, y, groups))

    gbm = lgb.LGBMClassifier(n_estimators=400, learning_rate=0.04, num_leaves=15, min_child_samples=20,
                             subsample=0.8, subsample_freq=1, colsample_bytree=0.8, verbose=-1)
    gbm.fit(X_feat[tr], y[tr])
    p_gbm = gbm.predict_proba(X_feat[te])[:, 1]

    vec = TfidfVectorizer(ngram_range=(1, 2), min_df=3, max_features=60000, sublinear_tf=True)
    Xt_tr = vec.fit_transform([X_text[i] for i in tr])
    Xt_te = vec.transform([X_text[i] for i in te])
    lr = LogisticRegression(C=2.0, max_iter=2000)
    lr.fit(Xt_tr, y[tr])
    p_lr = lr.predict_proba(Xt_te)[:, 1]
    p_blend = 0.5 * p_gbm + 0.5 * p_lr

    metrics = {"n_train": int(len(tr)), "n_test": int(len(te))}
    for name, p in (("lightgbm", p_gbm), ("tfidf_lr", p_lr), ("blend", p_blend)):
        metrics[f"auc_{name}"] = round(float(roc_auc_score(y[te], p)), 4)
        for sub in ("local_llm", "claude"):
            m = (subsets[te] == sub) | (subsets[te] == "human")
            if (subsets[te] == sub).any():
                metrics[f"auc_{name}_{sub}_vs_human"] = round(float(roc_auc_score(y[te][m], p[m])), 4)
    metrics["accuracy_blend@0.5"] = round(float(((p_blend >= 0.5) == y[te]).mean()), 4)
    hum = p_blend[y[te] == 0]
    metrics["human_p90_score"] = round(float(np.percentile(hum, 90)), 4)

    imp = sorted(zip(FEATURE_NAMES, gbm.booster_.feature_importance("gain")), key=lambda x: -x[1])
    metrics["top_features"] = [n for n, _ in imp[:12]]
    names = np.array(vec.get_feature_names_out())
    coef = lr.coef_[0]
    metrics["top_ai_ngrams"] = names[np.argsort(-coef)[:30]].tolist()
    metrics["top_human_ngrams"] = names[np.argsort(coef)[:30]].tolist()

    oof = oof_scores(X_feat, X_text, y, groups)
    human_oof = oof[y == 0]
    calib = {
        "pass_mark": float(np.percentile(human_oof, 90)),
        "paragraph_flag": float(np.percentile(human_oof, 95)),
        "human_chunk_p50": float(np.percentile(human_oof, 50)),
        "ai_chunk_p50": float(np.percentile(oof[y == 1], 50)),
    }
    metrics["calibration_oof"] = {k: round(v, 4) for k, v in calib.items()}

    gbm.fit(X_feat, y)
    lr.fit(vec.fit_transform(X_text), y)
    human_feats = X_feat[y == 0]
    baseline = {"mean": human_feats.mean(axis=0).tolist(), "std": (human_feats.std(axis=0) + 1e-9).tolist(),
                "names": FEATURE_NAMES}
    MODELS.mkdir(exist_ok=True)
    oe = ours_eval(gbm, vec, lr)
    if oe:
        sc = oe.pop("_scores")
        oe["ours_share_above_threshold"] = round(float((sc > calib["paragraph_flag"]).mean()), 4)
        metrics["our_blogs_out_of_sample"] = oe
    version = "v2-matched-" + str(len(rows))
    metrics["version"] = version
    joblib.dump({"gbm": gbm, "vec": vec, "lr": lr, "weights": (0.5, 0.5), "baseline": baseline, "metrics": metrics,
                 "threshold": calib["paragraph_flag"], "calib": calib, "version": version}, MODELS / "scorer.joblib")
    (MODELS / "scorer_metrics.json").write_text(json.dumps(metrics, indent=2))
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
