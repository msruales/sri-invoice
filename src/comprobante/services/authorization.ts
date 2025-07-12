import { createClient, Client } from 'soap';

export async function documentAuthorization(
  accessKey: string,
  authorizationUrl: string,
) {
  const params = { claveAccesoComprobante: accessKey };
  const authorizationRequest = new Promise((resolve, reject) => {
    createClient(authorizationUrl, (err: any, client: Client) => {
      if (!client) reject(err);
      client.autorizacionComprobante(params, (err: any, result: unknown) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(result);
      });
    });
  });

  return await authorizationRequest;
}
