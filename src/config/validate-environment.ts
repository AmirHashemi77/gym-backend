type EnvironmentConfig = Record<string, string | undefined>;

export function validateEnvironment(config: EnvironmentConfig): EnvironmentConfig {
  const requiredKeys = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
  const missingKeys = requiredKeys.filter((key) => !config[key]);

  if (missingKeys.length > 0) {
    throw new Error(`Missing required environment variables: ${missingKeys.join(', ')}`);
  }

  if (config.NODE_ENV === 'production') {
    const insecureKeys = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'].filter((key) =>
      config[key]?.startsWith('change-me-'),
    );

    if (insecureKeys.length > 0) {
      throw new Error(`Replace placeholder secrets before production deploy: ${insecureKeys.join(', ')}`);
    }
  }

  return config;
}
