package com.slavic.mod;

import net.fabricmc.api.ClientModInitializer;

public class SlavicClientMod implements ClientModInitializer {
    @Override
    public void onInitializeClient() {
        HudOverlay.init();
        ZoomFeature.init();
        SlavicMod.LOGGER.info("[Slavic MOD] Client features: HUD + Zoom loaded.");
    }
}