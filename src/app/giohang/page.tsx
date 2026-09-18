import type { Metadata } from "next";
import { WaterpointFrame } from "@/components/sections/waterpoint/WaterpointFrame";

export const metadata: Metadata = {
  title: "Giỏ hàng Waterpoint",
  description:
    "Cập nhật giỏ hàng và mặt bằng phân lô mới nhất tại Waterpoint City. ERA Vietnam độc quyền phân phối Aquaria & Park Village.",
  openGraph: {
    title: "Giỏ hàng Waterpoint City - ERA Vietnam",
    description:
      "Giỏ hàng và mặt bằng phân lô mới nhất tại Waterpoint City. Độc quyền Aquaria & Park Village.",
  },
};

/* TAB "Gio hang": goc nhin 360 nhin thang xuong khu phan lo Aquaria.
   (Lop ma lo se gan sau theo tien do cua team.) */
export default function GioHangPage() {
  return (
    <WaterpointFrame
      src="/waterpoint/giohang/index.html"
      title="Waterpoint - Giỏ hàng"
    />
  );
}
