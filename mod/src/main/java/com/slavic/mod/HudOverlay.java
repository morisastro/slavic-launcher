package com.slavic.mod;

import net.fabricmc.fabric.api.client.rendering.v1.HudRenderCallback;
import net.minecraft.client.MinecraftClient;
import net.minecraft.text.Text;

public class HudOverlay {
    private static long lastTime = System.currentTimeMillis();
    private static int frameCount = 0;
    private static int fps = 0;

    public static void init() {
        HudRenderCallback.EVENT.register((context, tickDelta) -> {
            MinecraftClient client = MinecraftClient.getInstance();
            if (client.player == null) return;
            // Skip if F3 debug screen is open
            if (client.getDebugHud().shouldShowDebugHud()) return;

            frameCount++;
            long now = System.currentTimeMillis();
            if (now - lastTime >= 1000) {
                fps = frameCount;
                frameCount = 0;
                lastTime = now;
            }

            int px = client.player.getBlockPos().getX();
            int py = client.player.getBlockPos().getY();
            int pz = client.player.getBlockPos().getZ();

            context.drawText(
                client.textRenderer,
                Text.literal("\u00a7b\u00a7lSlavic MOD"),
                5, 5, 0x5B8CFF, true
            );
            context.drawText(
                client.textRenderer,
                Text.literal("\u00a77FPS: \u00a7f" + fps),
                5, 17, 0xFFFFFF, true
            );
            context.drawText(
                client.textRenderer,
                Text.literal("\u00a77XYZ: \u00a7f" + px + " \u00a77/ \u00a7f" + py + " \u00a77/ \u00a7f" + pz),
                5, 29, 0xAAAAAA, true
            );
        });
    }
}