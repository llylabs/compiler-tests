import styles from './page.module.css';

export default function CssModPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>CSS Modules</h1>
      <p className={styles.item}>Scoped styles</p>
    </div>
  );
}
