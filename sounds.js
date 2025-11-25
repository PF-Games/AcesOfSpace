class SoundManager {
    constructor() {
        this.sounds = {};
        this.masterVolume = 1.0;
        this.sfxVolume = 0.7;
    }

    async loadSound(name, path) {
        try {
            const audio = new Audio(path);
            await audio.load();
            this.sounds[name] = {
                path: path,
                baseAudio: audio
            };
            console.log(`✅ Sound loaded: ${name}`);
            return true;
        } catch (error) {
            console.error(`❌ Failed to load sound: ${name}`, error);
            return false;
        }
    }

    playSound(name, options = {}) {
        if (!this.sounds[name]) {
            console.warn(`Sound "${name}" not loaded`);
            return null;
        }

        // Create a new Audio instance for each play (allows overlapping sounds)
        const audio = new Audio(this.sounds[name].path);

        // Apply options with defaults
        const volume = (options.volume ?? 1.0) * this.sfxVolume * this.masterVolume;
        const pitch = options.pitch ?? 1.0;
        const loop = options.loop ?? false;

        audio.volume = Math.max(0, Math.min(1, volume)); // Clamp 0-1
        audio.playbackRate = Math.max(0.5, Math.min(2.0, pitch)); // Clamp 0.5-2.0
        audio.loop = loop;

        // Play the sound
        audio.play().catch(error => {
            console.warn(`Failed to play sound "${name}":`, error);
        });

        return audio;
    }

    // Preset: Rocket launch with variation
    playRocketLaunch() {
        const pitch = 0.9 + Math.random() * 0.3; // 0.9 to 1.2
        const volume = 0.6 + Math.random() * 0.2; // 0.6 to 0.8
        return this.playSound('rocketLaunch', { pitch, volume });
    }

    // Preset: Explosion with variation
    playExplosion() {
        const pitch = 0.85 + Math.random() * 0.4; // 0.85 to 1.25
        const volume = 0.7 + Math.random() * 0.3; // 0.7 to 1.0
        return this.playSound('explosion', { pitch, volume });
    }

    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }

    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }
}
