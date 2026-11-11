import { describe, it, expect } from "vitest";
import { flushPromises } from "@vue/test-utils";
import App from "../src/App.vue";
import { mountWithPlugins, createTestRouter } from "./testUtils.js";

describe("App.vue", () => {
  it("mounts the Vuetify application shell", async () => {
    const { wrapper } = await mountWithPlugins(App, {
      router: await createTestRouter("/"),
      global: {
        stubs: {
          "router-view": { render: () => null },
        },
      },
    });

    expect(wrapper.find(".v-application").exists()).toBe(true);
  });
});

describe("Feature 2 — Assignment Management", () => {
  describe("US-2.6 — Switch pages from a sidebar", () => {
    it("User opens classes from the sidebar", async () => {
      const router = await createTestRouter("/");
      const { wrapper } = await mountWithPlugins(App, { router });

      const drawer = wrapper.findComponent({ name: "VNavigationDrawer" });
      expect(drawer.exists()).toBe(true);
      expect(drawer.props("color")).toBe("primary");
      expect(wrapper.find(".v-app-bar").exists()).toBe(false);

      const classes = wrapper.find('a[href="/classes"]');
      expect(classes.exists()).toBe(true);
      await classes.trigger("click");
      await flushPromises();

      expect(router.currentRoute.value.path).toBe("/classes");
    });
  });
});
