export async function GET() {
  const response = await fetch("https://bibletalk.tv/devos.json");

  if (!response.ok) {
    return Response.json(
      { error: "Failed to fetch data" },
      { status: response.status },
    );
  }

  const data = await response.json();
  return Response.json(data);
}
