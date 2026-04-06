export async function GET() {
  const translation = "BSB";

  const response = await fetch(
    `https://bible.helloao.org/api/${translation}/books.json`,
  );

  if (!response.ok) {
    return Response.json(
      { error: "Failed to fetch data" },
      { status: response.status },
    );
  }

  const data = await response.json();

  console.log(`my data : ${data}`);

  return Response.json(data);
}
