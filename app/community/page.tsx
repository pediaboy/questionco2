import { Metadata } from "next";
import CommunityClient from "./CommunityClient";

export const metadata: Metadata = {
  title: "COMMUNITY HUB — LASTQUESTION.CO",
  description:
    "Pusat koordinasi operasional, transparansi statistik ekosistem, dan saluran komunikasi taktis antar anggota LASTQUESTION.CO.",
};

export default function CommunityPage() {
  return <CommunityClient />;
}
