import BlogForm from '../BlogForm';

export default function EditBlogPage({ params }: { params: { id: string } }) {
  return <BlogForm blogId={params.id} />;
}
