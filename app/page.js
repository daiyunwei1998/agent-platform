import Image from "next/image";
import styles from "./page.module.css";
import AgentChat from "./components/AgentChat";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <AgentChat/>
      </main>
      <footer className={styles.footer}>
       
      </footer>
    </div>
  );
}
