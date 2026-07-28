import { Card } from "antd";

export default function RouteTimelineCard({
  depTime,
  arrTime,
  durationText,
  srcName,
  srcFull,
  destName,
  destFull,
}) {
  return (
    <Card style={{ borderRadius: "16px", border: "1px solid #eef0f2" }}>
      <div style={{ display: "flex", gap: "24px", padding: "10px 0" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "50px",
            alignItems: "flex-end",
            minWidth: "50px",
          }}
        >
          <span
            style={{ fontSize: "1.1rem", fontWeight: 800, color: "#054752" }}
          >
            {depTime}
          </span>
          <span
            style={{ fontSize: "0.85rem", color: "#708c91", fontWeight: 500 }}
          >
            {durationText}
          </span>
          <span
            style={{ fontSize: "1.1rem", fontWeight: 800, color: "#054752" }}
          >
            {arrTime}
          </span>
        </div>

        <div
          style={{
            position: "relative",
            width: "2px",
            backgroundColor: "#00aff5",
            margin: "8px 0",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-4px",
              left: "-4px",
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "#fff",
              border: "2px solid #00aff5",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-4px",
              left: "-4px",
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "#fff",
              border: "2px solid #00aff5",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "50px",
            flex: 1,
          }}
        >
          <div>
            <span
              style={{ fontSize: "1.1rem", fontWeight: 700, color: "#054752" }}
            >
              {srcName}
            </span>
            <div
              style={{
                fontSize: "0.85rem",
                color: "#708c91",
                marginTop: "2px",
              }}
            >
              {srcFull}
            </div>
          </div>
          <div>
            <span
              style={{ fontSize: "1.1rem", fontWeight: 700, color: "#054752" }}
            >
              {destName}
            </span>
            <div
              style={{
                fontSize: "0.85rem",
                color: "#708c91",
                marginTop: "2px",
              }}
            >
              {destFull}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
