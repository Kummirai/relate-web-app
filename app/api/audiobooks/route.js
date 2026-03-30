export async function GET() {
  const response = await fetch("https://bibletalk.tv/audiobooks.json");

  if (!response.ok) {
    return Response.json(
      {
        error: "Failed to fetch",
      },
      { error: response.status },
    );
  }

  const data = response.json();
  console.log(data);

  return Response.json(data);
}
