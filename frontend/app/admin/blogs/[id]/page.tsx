import BlogForm from '../BlogForm';

export default async function EditBlogPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return <BlogForm blogId={params.id} />;
}
