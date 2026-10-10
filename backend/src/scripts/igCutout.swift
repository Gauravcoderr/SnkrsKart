// Cuts the sneaker out of a product photo with Apple Vision (the same model
// as "Lift subject" in Photos). macOS 14+. igDraft.ts compiles it on demand.
// usage: ig-cutout <in-image> <out.png>  (exit 3 = no subject found)
//        ig-cutout --text <in-image>     (prints text found in the image, one line each)

import Foundation
import Vision
import CoreImage
import CoreImage.CIFilterBuiltins
import ImageIO
import UniformTypeIdentifiers

let args = CommandLine.arguments
if args.count == 3 && args[1] == "--text" {
    guard let src = CGImageSourceCreateWithURL(URL(fileURLWithPath: args[2]) as CFURL, nil), let cg = CGImageSourceCreateImageAtIndex(src, 0, nil) else { exit(65) }
    let req = VNRecognizeTextRequest()
    req.recognitionLevel = .accurate
    req.usesLanguageCorrection = false
    try? VNImageRequestHandler(cgImage: cg).perform([req])
    for obs in req.results ?? [] { if let top = obs.topCandidates(1).first, top.confidence > 0.3 { print(top.string) } }
    exit(0)
}
guard args.count == 3 else { FileHandle.standardError.write("usage: cutout <in> <out.png>\n".data(using: .utf8)!); exit(64) }
let input = URL(fileURLWithPath: args[1]), output = URL(fileURLWithPath: args[2])
guard let src = CGImageSourceCreateWithURL(input as CFURL, nil), let cg = CGImageSourceCreateImageAtIndex(src, 0, nil) else { exit(65) }
let req = VNGenerateForegroundInstanceMaskRequest()
let handler = VNImageRequestHandler(cgImage: cg)
do { try handler.perform([req]) } catch { FileHandle.standardError.write("vision failed: \(error)\n".data(using: .utf8)!); exit(70) }
guard let obs = req.results?.first, !obs.allInstances.isEmpty else { FileHandle.standardError.write("no subject\n".data(using: .utf8)!); exit(3) }
let buf = try obs.generateMaskedImage(ofInstances: obs.allInstances, from: handler, croppedToInstancesExtent: true)
let ci = CIImage(cvPixelBuffer: buf)
let ctx = CIContext()
guard let out = ctx.createCGImage(ci, from: ci.extent), let dest = CGImageDestinationCreateWithURL(output as CFURL, UTType.png.identifier as CFString, 1, nil) else { exit(74) }
CGImageDestinationAddImage(dest, out, nil)
CGImageDestinationFinalize(dest)
print("\(obs.allInstances.count) \(out.width)x\(out.height)")
