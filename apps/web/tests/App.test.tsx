import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { App } from "../src/App.tsx";

describe("App", () => {
  it("renders an empty semantic shell without product UI copy", () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toBe('<main aria-label="Escape Room Hub" class="app-shell"></main>');
  });
});
