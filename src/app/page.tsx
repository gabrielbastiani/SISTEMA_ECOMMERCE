import { Section } from "./components/section";
import { TitlePage } from "./components/section/titlePage";
import { SidebarAndHeader } from "./components/sidebarAndHeader";


export default function Home() {
  return (
    <SidebarAndHeader>
      <Section>
        <TitlePage title="DASHBOARD" />



      </Section>
    </SidebarAndHeader>
  );
}
