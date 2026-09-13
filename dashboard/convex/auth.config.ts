// Cloudflare Access issues the JWT used by Convex custom JWT auth. The values
// are public issuer metadata; signing keys remain hosted by Cloudflare.
export default {
  providers: [{
    type: 'customJwt',
    issuer: 'https://shrill-cherry-ba30.cloudflareaccess.com',
    applicationID: '6ecad68b7fdd6831f29a5c8e622edfb8c827c9e1854401eb480657c7732765dd',
    jwks: 'https://shrill-cherry-ba30.cloudflareaccess.com/cdn-cgi/access/certs',
    algorithm: 'RS256',
  }],
}
