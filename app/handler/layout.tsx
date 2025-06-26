import HandlerHeader from "@/components/handler-header";
import { Provider } from "../provider";

export default function Layout(props: { children: React.ReactNode }) {
  return (
    <Provider>
      <div className="flex flex-col h-screen">
        <HandlerHeader />
        <div className="flex-grow">{props.children}</div>
      </div>
    </Provider>
  );
}