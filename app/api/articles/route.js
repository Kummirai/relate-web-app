export async function GET() {
  const response = await fetch("https://bibletalk.tv/articles.json");

  if (!response.ok) {
    return Response.json(
      { error: "Failed to fetch data" },
      { status: response.status },
    );
  }

  const data = response.json();
  return Response.json(data);
}
