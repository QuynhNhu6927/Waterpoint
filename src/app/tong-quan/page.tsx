import type { Metadata } from "next";
import { WaterpointFrame } from "@/components/sections/waterpoint/WaterpointFrame";

export const metadata: Metadata = {
  title: "Tổng quan khu đô thị 360°",
  description:
    "Panorama tổng thể Waterpoint City 355ha: 8 phân khu (Aquaria, Park Village, The Pearl, ...) và 20+ tiện ích nổi bật ven sông Vàm Cỏ.",
  openGraph: {
    title: "Tổng quan khu đô thị Waterpoint City 360°",
    description:
      "Panorama tổng thể Waterpoint City 355ha: 8 phân khu và 20+ tiện ích nổi bật ven sông Vàm Cỏ.",
  },
};

/* TAB "Tong quan khu do thi": panorama tong the + 8 phan khu + 20 POI tien ich. */
export default function TongQuanPage() {
  return (
    <WaterpointFrame
      src="/waterpoint/tong-quan/index.html"
      title="Waterpoint - Tổng quan khu đô thị"
    />
  );
}
