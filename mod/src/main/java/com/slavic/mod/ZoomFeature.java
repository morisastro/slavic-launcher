package com.slavic.mod;

import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents;
import net.fabricmc.fabric.api.client.keybinding.v1.KeyBindingHelper;
import net.minecraft.client.option.KeyBinding;
import net.minecraft.client.util.InputUtil;
import org.lwjgl.glfw.GLFW;

public class ZoomFeature {
    private static KeyBinding zoomKey;
    private static boolean wasZooming = false;
    private static int originalFov = 70;

    public static void init() {
        zoomKey = KeyBindingHelper.registerKeyBinding(new KeyBinding(
            "key.slavic.zoom",
            InputUtil.Type.KEYSYM,
            GLFW.GLFW_KEY_C,
            "Slavic MOD"
        ));

        ClientTickEvents.END_CLIENT_TICK.register(client -> {
            boolean zooming = zoomKey.isPressed();
            if (zooming && !wasZooming) {
                originalFov = client.options.getFov().getValue();
                client.options.getFov().setValue(30);
                wasZooming = true;
            } else if (!zooming && wasZooming) {
                client.options.getFov().setValue(originalFov);
                wasZooming = false;
            }
        });
    }
}