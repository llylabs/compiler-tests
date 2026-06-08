export default function CrashPage() {
  throw new Error("intentional crash");
  return <div>never reached</div>;
}
