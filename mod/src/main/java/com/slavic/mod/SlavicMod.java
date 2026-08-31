package com.slavic.mod;

import net.fabricmc.api.ModInitializer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class SlavicMod implements ModInitializer {
    public static final Logger LOGGER = LoggerFactory.getLogger("Slavic MOD");

    @Override
    public void onInitialize() {
        LOGGER.info("[Slavic MOD] Loaded — Lunar-like features for Slavic Launcher.");
    }
}