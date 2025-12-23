import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const WEBHOOK_URL = "https://n8n-app.stg.beno.com/webhook/circle-beno";
const TABLE_NAME = process.env.BENO_CERCILE_TABLE || "BenoCercileRegistrations";
const REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;

const docClient = REGION
  ? DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }))
  : null;

type RegistrationPayload = {
  fullName: string;
  email: string;
  mobile: string;
  nationality: string;
  residency: string;
  interests: string[];
  winner: boolean;
  prize: string | null;
};

const normalizePayload = (body: Record<string, unknown>) => {
  const fullName = String(body.fullName || "").trim();
  const email = String(body.email || "").trim();
  const mobile = String(body.mobile || "").trim();
  const nationality = String(body.nationality || "").trim();
  const residency = String(body.residency || "").trim();
  const interests = Array.isArray(body.interests)
    ? body.interests.filter((item) => typeof item === "string" && item.trim().length > 0)
    : [];
  const winner =
    body.winner === true ||
    body.winner === "true" ||
    body.winner === "yes" ||
    body.winner === "Winner";
  const prizeValue = typeof body.prize === "string" ? body.prize.trim() : "";
  const prize = winner ? prizeValue : null;

  if (!fullName || !email || !mobile || !nationality || !residency) {
    return { error: "Missing required fields." };
  }

  if (winner && !prizeValue) {
    return { error: "Winner prize is required." };
  }

  const payload: RegistrationPayload = {
    fullName,
    email,
    mobile,
    nationality,
    residency,
    interests,
    winner,
    prize,
  };

  return { payload };
};

export async function POST(request: Request) {
  if (!docClient) {
    return NextResponse.json(
      { error: "AWS region is not configured for DynamoDB." },
      { status: 500 }
    );
  }

  try {
    const body = (await request.json()) as unknown;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

    const normalized = normalizePayload(body as Record<string, unknown>);
    if (normalized.error || !normalized.payload) {
      return NextResponse.json({ error: normalized.error }, { status: 400 });
    }

    const record = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      ...normalized.payload,
    };

    const [_, webhookResponse] = await Promise.all([
      docClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: record,
        })
      ),
      fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(record),
      }),
    ]);

    if (!webhookResponse.ok) {
      const detail = await webhookResponse.text();
      throw new Error(
        `Webhook responded with ${webhookResponse.status}: ${detail || "Unknown error"}`
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Submission failed." },
      { status: 500 }
    );
  }
}
