declare module 'chan' {
  export default function chan(): { (): () => void, close(): void };
}
