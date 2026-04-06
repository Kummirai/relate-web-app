export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const book = searchParams.get("book");
  const chapter = searchParams.get("chapter");
  const translation = searchParams.get("translation");

  console.log(book, chapter, translation);

  const response = await fetch(
    `https://bible.helloao.org/api/${translation}/${book}/${chapter}.json`,
  );

  if (!response.ok) {
    return Response.json(
      { error: "Failed to fetch data" },
      { status: response.status },
    );
  }

  const data = await response.json();

  console.log(`my data:`, data);

  return Response.json(data);
}
