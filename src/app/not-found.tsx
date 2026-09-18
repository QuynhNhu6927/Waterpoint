"use client";

import { useEffect } from "react";
import { WP_ROUTES } from "@/lib/routes";

/* Moi route khong ton tai (404) tu dong quay ve trang chu.
   Dang CLIENT component (khong dung redirect() server-side) de tuong thich
   voi output: "export" — host tinh se serve trang nay roi JS doi ve home. */
export default function NotFound() {
  useEffect(() => {
    window.location.replace(WP_ROUTES.home);
  }, []);

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#000",
        color: "#7fd3e3",
        fontFamily: "Montserrat, sans-serif",
      }}
    >
      <p>Đang quay về trang chủ…</p>
    </main>
  );
}
