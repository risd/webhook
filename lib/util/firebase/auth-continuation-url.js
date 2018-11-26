module.exports = FirebaseAuthContinuationUrl;

// options : { siteName : string, userEmail : string } => continuationUrl : string
function FirebaseAuthContinuationUrl ( options ) {
  var msg = `
    Method must be implemented for specific webhook implementation.
    The URL produced by this function will be embedded within the
    password reset email, used as the destination for the user after
    they have reset their password.
    
    For more on this URL visit:
      https://firebase.google.com/docs/reference/js/firebase.auth.Auth#sendPasswordResetEmail
  `.trim()
  throw new Error( msg )
}
