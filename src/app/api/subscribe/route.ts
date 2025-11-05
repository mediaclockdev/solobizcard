import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { name, email, businessCategory, clientsPreference } =
      await req.json();
    const forwarded = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");

    let ip = forwarded?.split(",")[0].trim() || realIp || null;

    if (!ip || ip === "127.0.0.1" || ip === "::1") {
      const res = await fetch("https://api.ipify.org?format=json");
      const data = await res.json();
      ip = data.ip;
    }

    const response = await fetch("https://api.getresponse.com/v3/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Token": `api-key 33zhg7sm703lqj8w09ho00ff3yecgi06`,
      },
      body: JSON.stringify({
        name,
        email,
        campaign: {
          campaignId: "PMQNb",
        },
        customFieldValues: [
          {
            customFieldId: "nKhMUa",
            value: [businessCategory],
          },
          {
            customFieldId: "nKh5qy",
            value: [clientsPreference],
          },
        ],
        ipAddress: ip,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("GetResponse API error:", response.status, data);
      return NextResponse.json(
        { error: "GetResponse request failed", details: data },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Server crashed:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
