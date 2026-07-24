// ==========================================================================
// AZ STORE — Configuration générale (js/config.js)
// À personnaliser avant la mise en ligne.
// ==========================================================================

const SITE_CONFIG = {
  // Numéro WhatsApp au format international SANS "+", ex: "212612345678"
  whatsappNumber: "212600000000",

  // EmailJS : crée un compte gratuit sur https://www.emailjs.com
  // 1. Ajoute un "Email Service" (ex: Gmail) -> récupère le SERVICE_ID
  // 2. Crée un "Email Template" avec les variables :
  //    {{product_title}}, {{price}}, {{customer_contact}}, {{message}}
  //    -> récupère le TEMPLATE_ID
  // 3. Dans "Account > General" récupère la PUBLIC_KEY
  emailjs: {
    publicKey: "YOUR_EMAILJS_PUBLIC_KEY",
    serviceId: "YOUR_EMAILJS_SERVICE_ID",
    templateId: "YOUR_EMAILJS_TEMPLATE_ID"
  }
};
