import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { content } = await request.json();

    // Renderiza mantendo as tags EJS visíveis
    const html = content
      .replace(/<%=\s*(.+?)\s*%>/g, (_: any, variable: any) =>
        `<span style="color: #dc2626; background: #fef2f2; padding: 2px 4px; border-radius: 4px; font-family: monospace;">
          &lt;%= ${variable} %&gt;
        </span>`
      );

    return new Response(html, {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro na formatação do preview" },
      { status: 500 }
    );
  }
}