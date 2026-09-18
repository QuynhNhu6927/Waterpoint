import type { Metadata } from "next";
import { WaterpointFrame } from "@/components/sections/waterpoint/WaterpointFrame";

export const metadata: Metadata = {
  title: "Tiện ích Waterpoint",
  description:
    "Hệ thống tiện ích nội khu và ngoại khu Waterpoint City: trường học quốc tế, y tế, thương mại, vui chơi giải trí ven sông Vàm Cỏ.",
  openGraph: {
    title: "Tiện ích Waterpoint City - ERA Vietnam",
    description:
      "Hệ thống tiện ích nội khu và ngoại khu Waterpoint City ven sông Vàm Cỏ.",
  },
};

/* TAB "Tien ich": panorama gan nhan cac tien ich cua khu do thi. */
export default function TienIchPage() {
  return (
    <WaterpointFrame
      src="/waterpoint/tienich/index.html"
      title="Waterpoint - Tiện ích"
    />
  );
}
