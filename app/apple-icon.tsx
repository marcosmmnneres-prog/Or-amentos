import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #FF6A00, #FFB000)",
          color: "#0B0B0D",
          fontSize: 110,
          fontWeight: 800,
        }}
      >
        O
      </div>
    ),
    size
  );
}
