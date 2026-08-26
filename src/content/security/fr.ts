import type { SecurityContent } from "./types";

/**
 * Texte français, écrit pour des lecteurs francophones plutôt que traduit.
 *
 * Les affirmations sont les mêmes que dans en.ts parce qu'elles décrivent le
 * même logiciel ; la formulation, elle, est propre au français. Aucune norme
 * (ISO, SOC 2, PCI DSS pour ce service, RGPD) n'est revendiquée, et aucun délai
 * de réponse n'est promis : rien dans le projet ne permettrait de le tenir.
 */
export const securityFr: SecurityContent = {
  eyebrow: "Sécurité",
  title: "Sécurité et confidentialité",
  lede: "La protection de vos documents et de vos données est au cœur d'EasyInvoiceOCR. Cette page décrit ce que nous faisons réellement, et non ce qui sonnerait rassurant.",
  heroNote: "Vos documents sont lus dans votre navigateur. Ils ne nous sont jamais transmis.",

  overview: {
    title: "Une protection multicouche",
    lede: "La sécurité n'est pas une fonctionnalité. C'est une série de décisions prises à chaque niveau, depuis l'endroit où votre fichier est ouvert jusqu'à qui peut lire une ligne dans la base.",
    pillars: [
      {
        icon: "file",
        title: "Protection des documents",
        body: "La reconnaissance et la conversion s'exécutent dans votre navigateur. Votre fichier est ouvert et traité localement, et c'est vous qui enregistrez le résultat : il ne parvient jamais à nos serveurs.",
      },
      {
        icon: "shield",
        title: "Sécurité du compte",
        body: "La connexion repose sur Supabase Auth. Les mots de passe sont hachés, jamais conservés en clair, et confrontés aux fuites connues avant d'être acceptés.",
      },
      {
        icon: "lock",
        title: "Protection des données",
        body: "Toutes les connexions passent par HTTPS, imposé par une politique de transport stricte. Ce que nous conservons se limite à ce que le fonctionnement de votre compte exige.",
      },
      {
        icon: "server",
        title: "Une infrastructure maîtrisée",
        body: "PostgreSQL managé avec sécurité au niveau des lignes, des identifiants de service qui n'atteignent jamais le navigateur, et un déploiement qui se verrouille lorsque la configuration est incomplète.",
      },
    ],
  },

  encryption: {
    title: "Chiffrement des données",
    lede: "Le chiffrement compte à deux moments : quand les données circulent, et quand elles sont au repos.",
    points: [
      "Chaque échange entre votre navigateur et nos serveurs passe par HTTPS. Le site envoie une politique de transport stricte : un navigateur qui a visité le site une fois refusera ensuite toute connexion en HTTP simple.",
      "Les données de votre compte sont hébergées dans PostgreSQL managé chez Supabase, qui chiffre les données stockées et les sauvegardes au niveau de la plateforme.",
      "Les mots de passe ne sont jamais stockés en clair. Supabase Auth en conserve une empreinte salée, et un mot de passe figurant dans une fuite connue est refusé dès l'inscription.",
      "Les coordonnées bancaires ne nous parviennent pas du tout : elles sont saisies sur les pages de PayPal, donc il n'y a rien à chiffrer de notre côté.",
    ],
  },

  account: {
    title: "Sécurité de votre compte",
    lede: "Ce qui se tient entre votre compte et quelqu'un qui chercherait à y entrer.",
    points: [
      {
        title: "Exigences sur le mot de passe",
        body: "Huit caractères au minimum, dont une lettre et un chiffre. Un mot de passe présent dans une fuite connue est refusé, et non simplement déconseillé.",
      },
      {
        title: "Connexion avec Google",
        body: "Vous pouvez utiliser Google plutôt qu'un mot de passe. L'authentification se déroule sur les pages de Google et vos identifiants Google ne nous sont jamais transmis.",
      },
      {
        title: "Adresses e-mail vérifiées",
        body: "Votre adresse doit être confirmée avant que l'offre gratuite puisse être activée, ce qui empêche de créer en masse des comptes utilisables avec des adresses non vérifiées.",
      },
      {
        title: "Récupération du mot de passe",
        body: "Les liens de réinitialisation sont envoyés à votre adresse et expirent. Une demande pour une adresse sans compte renvoie exactement la même réponse qu'une adresse existante : le formulaire ne permet donc pas de découvrir qui possède un compte.",
      },
      {
        title: "Sessions",
        body: "Les sessions expirent et se renouvellent d'elles-mêmes. La déconnexion efface la session ainsi que tout ce qui était mis en cache sur votre compte dans ce navigateur.",
      },
      {
        title: "Messages d'erreur neutres",
        body: "Une inscription avec une adresse déjà enregistrée ne le signale pas. Le confirmer permettrait de tester une liste d'adresses contre notre base d'utilisateurs.",
      },
    ],
  },

  documents: {
    title: "Protection de vos fichiers et documents",
    lede: "Une facture est un document d'entreprise. Elle porte des noms, des adresses, des montants et des conditions : un convertisseur qui en garderait discrètement une copie serait un mauvais endroit où l'envoyer.",
    steps: [
      {
        icon: "upload",
        title: "Vous choisissez un fichier",
        body: "Le fichier est ouvert par le navigateur depuis votre propre disque. Aucune requête ne l'emporte ailleurs.",
      },
      {
        icon: "cpu",
        title: "Le traitement est local",
        body: "La lecture du PDF et la reconnaissance de texte s'exécutent en WebAssembly dans la page. Seuls le moteur de reconnaissance et ses données linguistiques sont téléchargés.",
      },
      {
        icon: "table",
        title: "Les données sont extraites",
        body: "Champs, tableaux et totaux sont assemblés en mémoire, dans l'onglet que vous avez sous les yeux.",
      },
      {
        icon: "download",
        title: "Vous enregistrez le résultat",
        body: "Le tableur ou le document terminé est écrit par votre navigateur directement sur votre appareil.",
      },
    ],
    note: "Nous enregistrons qu'une conversion a eu lieu — quel outil, combien de pages, si elle a abouti — parce que le quota doit être compté à un endroit que le navigateur ne peut pas modifier. Cet enregistrement ne contient aucun contenu de page ni aucun fichier. Cette application ne comporte aucun mécanisme de téléversement.",
  },

  infrastructure: {
    title: "Une infrastructure pensée pour la sécurité",
    lede: "Les parties du système que vous ne voyez jamais, et les règles qu'elles suivent.",
    points: [
      {
        title: "Authentification",
        body: "Supabase Auth émet et valide chaque session. Le code serveur vérifie le jeton à chaque requête et en déduit votre identité, jamais à partir de ce que la page envoie.",
      },
      {
        title: "Base de données",
        body: "PostgreSQL managé. Le navigateur se connecte avec une clé publiable soumise à la sécurité au niveau des lignes ; la clé qui contourne ces règles n'existe que côté serveur.",
      },
      {
        title: "Transport",
        body: "HTTPS de bout en bout, avec une politique de transport stricte. Les certificats sont gérés par la plateforme et renouvelés automatiquement.",
      },
      {
        title: "Verrouillage par défaut",
        body: "Lorsqu'un réglage manquant pourrait nuire, la fonctionnalité refuse de s'exécuter plutôt que de supposer. Le paiement en production, par exemple, reste fermé tant que chaque identifiant n'est pas présent et que le propriétaire du compte ne l'a pas explicitement activé.",
      },
    ],
  },

  access: {
    title: "Contrôle des accès",
    lede: "Vos données doivent être accessibles par vous et par personne d'autre — et cela doit être imposé ailleurs que dans l'interface.",
    body: [
      "Chaque table privée est régie par la sécurité au niveau des lignes de PostgreSQL. Les règles vivent dans la base : elles s'appliquent donc à toute requête, quelle que soit la partie de l'application qui la formule, et tiennent même si le code applicatif comporte une faille.",
      "La règle est la même pour vos conversions, votre abonnement, vos compteurs d'usage et vos notifications : une ligne ne vous appartient que si son propriétaire correspond au compte qui la demande. Une requête portant sur les lignes d'un autre n'échoue pas avec une erreur — elle ne renvoie simplement rien.",
      "Atteindre un écran d'administration n'accorde aucun droit. Chaque action d'administration revérifie le rôle dans la base avant d'agir.",
    ],
  },

  payments: {
    title: "Sécurité des paiements",
    lede: "Les abonnements passent par PayPal, et la répartition des responsabilités est volontaire.",
    points: [
      "Les coordonnées bancaires sont saisies sur les pages de PayPal. Elles ne transitent jamais par ce site et nous ne les conservons pas.",
      "Le navigateur ne reçoit que l'identifiant public PayPal et l'offre choisie par le serveur. Une offre ou un tarif envoyé depuis la page n'est pas accepté.",
      "Lorsque PayPal annonce un abonnement approuvé, le serveur le confirme directement auprès de PayPal avant d'accorder quoi que ce soit, et refuse un abonnement qui ne porte pas sur l'offre que nous avons autorisée.",
      "Chaque notification reçue de PayPal est vérifiée auprès de PayPal avant d'être enregistrée ou appliquée, et une seconde réception du même événement ne change rien.",
    ],
  },

  monitoring: {
    title: "La sécurité est un processus continu",
    lede: "Un logiciel sûr le jour de sa mise en ligne ne l'est pas pour autant aujourd'hui.",
    stages: [
      {
        title: "Relire",
        body: "Les modifications touchant à l'authentification, à la facturation ou aux règles d'accès sont examinées pour ce qu'elles laissent passer, et pas seulement pour savoir si elles fonctionnent.",
      },
      {
        title: "Surveiller",
        body: "Les échecs de paiement et de traitement des notifications sont journalisés avec ce qu'il faut pour les diagnostiquer, et rien de plus : jamais de charge utile, jamais d'identifiants.",
      },
      {
        title: "Mettre à jour",
        body: "Les dépendances sont tenues à jour, les versions qui ne doivent pas bouger étant figées délibérément et pour une raison écrite.",
      },
      {
        title: "Améliorer",
        body: "Les faiblesses repérées en relecture sont corrigées à la source et couvertes par un test, afin que la même brèche ne puisse pas se rouvrir sans qu'on le remarque.",
      },
    ],
  },

  userTips: {
    title: "Aidez-nous à protéger votre compte",
    lede: "Quelques habitudes qui comptent davantage que tout ce que nous pouvons faire de notre côté.",
    tips: [
      "Utilisez un mot de passe solide, réservé à ce site, ou connectez-vous avec Google.",
      "Ne communiquez jamais vos identifiants, et méfiez-vous de quiconque vous les demande.",
      "Déconnectez-vous en quittant un ordinateur partagé ou public.",
      "Signalez-nous toute activité que vous ne reconnaissez pas sur votre compte.",
    ],
  },

  report: {
    title: "Vous avez découvert un problème de sécurité ?",
    body: "Si vous pensez avoir trouvé une vulnérabilité, prévenez-nous en privé avant d'en parler ailleurs. Utilisez le formulaire de contact en mentionnant la sécurité : décrire ce que vous avez trouvé et comment le reproduire nous aide à le confirmer et à le corriger rapidement.",
    cta: "Nous contacter",
  },

  finalCta: {
    title: "La sécurité au cœur de votre confiance",
    body: "Vos documents restent sur votre appareil, votre compte n'appartient qu'à vous, et chaque affirmation de cette page décrit une chose que le logiciel fait réellement.",
    cta: "Commencer gratuitement",
  },
};
