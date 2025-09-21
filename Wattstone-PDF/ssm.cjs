// Kleiner Helper: liest SSM (mit SecureString-Support) und liefert Defaults
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

const ssm = new SSMClient({ region: process.env.AWS_REGION || "eu-central-1" });

export async function readSSM(path, { decrypt=false, fallback="" }={}) {
  try {
    const { Parameter } = await ssm.send(new GetParameterCommand({
      Name: path, WithDecryption: decrypt
    }));
    return Parameter?.Value ?? fallback;
  } catch {
    return fallback;
  }
}
