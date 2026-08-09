import type { ResourcesContent } from "./types";

/**
 * Documentation et centre d'aide en français.
 *
 * Rédigé pour des lecteurs francophones plutôt que traduit mot à mot. Toutes
 * les affirmations factuelles sont strictement identiques aux versions anglaise
 * et arabe : cinq conversions gratuites une seule fois par compte vérifié,
 * reconnaissance dans le navigateur, aucune API opérationnelle, 20 Mo par
 * fichier.
 */

export const resourcesFr: ResourcesContent = {
  docChapters: [
    {
      slug: "getting-started",
      title: "Premiers pas",
      summary: "Créer un compte, lancer une première conversion et exporter le résultat.",
      sections: [
        {
          id: "create-account",
          title: "Créer un compte",
          body: [
            "Inscrivez-vous avec une adresse e-mail et un mot de passe d'au moins huit caractères mêlant lettres et chiffres, ou poursuivez avec Google. Un courriel de confirmation part immédiatement, et le compte devient utilisable dès que vous suivez le lien qu'il contient.",
            "Un compte est nécessaire avant toute conversion. Les conversions y sont rattachées afin que le quota gratuit puisse être décompté, et pour que votre historique vous appartienne plutôt qu'à une session de navigateur.",
          ],
        },
        {
          id: "first-upload",
          title: "Lancer une première conversion",
          body: [
            "Déposez un fichier sur la zone d'envoi ou choisissez-le dans l'explorateur. Les formats PDF, JPG, PNG et WebP sont acceptés, jusqu'à 20 Mo par fichier. Un PDF de plusieurs pages est traité comme un seul document et rendu comme un résultat unique.",
          ],
          list: [
            "Photographiez le document bien en face, les quatre coins dans le cadre.",
            "Une numérisation à 300 ppp ou plus donne la détection des lignes la plus fiable.",
            "Un PDF protégé par mot de passe doit être déverrouillé avant l'envoi.",
          ],
        },
        {
          id: "review-export",
          title: "Relire et exporter",
          body: [
            "Chaque champ extrait porte un indice de confiance. Ceux qui passent sous 0,85 sont signalés afin que vous les corrigiez avant l'export, et ce sont vos corrections que le fichier exporté contient.",
            "Les exports sont produits dans votre navigateur : Excel (.xlsx) avec une feuille de synthèse et une feuille de lignes ; CSV encodé en UTF-8 avec indicateur d'ordre des octets, pour que les caractères accentués et arabes survivent à Excel ; et JSON pour les systèmes qui consomment l'enregistrement brut.",
          ],
        },
      ],
    },
    {
      slug: "supported-documents",
      title: "Documents pris en charge",
      summary: "Formats, langues, limites de taille et champs lus par l'extracteur.",
      sections: [
        {
          id: "formats",
          title: "Formats de fichier et limites",
          body: ["Les entrées suivantes sont acceptées sur toutes les formules."],
          list: [
            "PDF — texte natif ou numérisé, en une ou plusieurs pages.",
            "JPG, PNG et WebP — images d'une seule page.",
            "Taille maximale : 20 Mo par document. C'est la seule limite réellement appliquée.",
          ],
        },
        {
          id: "languages",
          title: "Langues et écritures",
          body: [
            "Les écritures latine et arabe sont prises en charge, y compris les mises en page de droite à gauche et les factures qui mêlent les deux. Les chiffres sont ramenés à la forme occidentale et les dates au format ISO 8601 avant tout contrôle arithmétique, afin qu'aucune comparaison ne porte sur deux notations différentes.",
            "Lorsqu'une date est réellement ambiguë — 03/04/2026 désigne le 3 avril ou le 4 mars selon l'émetteur — le champ est signalé plutôt que tranché par hypothèse.",
          ],
        },
        {
          id: "fields",
          title: "Champs restitués",
          body: [
            "Les champs au niveau de la facture et un tableau de lignes sont restitués pour chaque document.",
          ],
          list: [
            "Nom, adresse et numéro de TVA du fournisseur.",
            "Numéro de facture, date de facture et date d'échéance.",
            "Total hors taxes, montant de TVA, total et devise.",
            "Lignes : désignation, quantité, prix unitaire, TVA et total de la ligne.",
          ],
        },
      ],
    },
    {
      slug: "exports-and-integrations",
      title: "Exports",
      summary: "Sorties Excel, CSV et JSON, et où en est l'API prévue.",
      sections: [
        {
          id: "excel",
          title: "Classeurs Excel",
          body: [
            "Le fichier .xlsx contient deux feuilles. « Synthèse » liste chaque champ avec sa valeur et son indice de confiance. « Lignes » contient une ligne par poste, prête pour un tableau croisé ou un import comptable.",
          ],
        },
        {
          id: "csv",
          title: "CSV",
          body: [
            "Les exports CSV ne contiennent que les lignes, séparées par des virgules et encodées en UTF-8 avec indicateur d'ordre des octets. Ils s'ouvrent directement dans Excel, Numbers ou Google Sheets sans question sur le jeu de caractères.",
          ],
        },
        {
          id: "api",
          title: "Accès API — bientôt disponible",
          body: [
            "Il n'existe pas d'API en service. Aucun point d'entrée n'accepte de requête, aucune clé n'est délivrée, et l'accès API ne fait partie d'aucune formule actuelle. L'interface en cours de conception est décrite sur la page API OCR afin que les intégrateurs en voient la forme envisagée, mais rien n'y est appelable aujourd'hui.",
          ],
        },
      ],
    },
    {
      slug: "accuracy-and-review",
      title: "Précision et relecture",
      summary: "Fonctionnement des indices de confiance et correction d'un résultat.",
      sections: [
        {
          id: "confidence",
          title: "Indices de confiance",
          body: [
            "Chaque champ reçoit une note entre 0 et 1. Au-dessus de 0,95, la valeur a été reconnue nettement. Entre 0,85 et 0,95, elle est probablement juste mais mérite un coup d'œil. En dessous de 0,85, le champ est mis en évidence pour relecture.",
          ],
        },
        {
          id: "arithmetic",
          title: "L'arithmétique est le meilleur contrôle",
          body: [
            "Un indice de confiance n'est que l'opinion du moteur sur lui-même. La cohérence des montants est une preuve plus solide : les lignes qui s'additionnent au sous-total, et le sous-total augmenté de la taxe qui donne le total annoncé. Les lignes qui ne se recoupent pas sont signalées plutôt qu'exportées en silence.",
          ],
        },
        {
          id: "corrections",
          title: "Corriger un champ",
          body: [
            "Cliquez sur n'importe quelle valeur du tableau de résultats pour la modifier. Les lignes peuvent être corrigées, ajoutées ou supprimées, et les totaux se recalculent au fur et à mesure. Les corrections s'appliquent immédiatement au fichier exporté.",
          ],
        },
      ],
    },
    {
      slug: "security-and-data",
      title: "Sécurité et traitement des données",
      summary: "Où restent les documents, ce qui est conservé et comment le supprimer.",
      sections: [
        {
          id: "local-processing",
          title: "La reconnaissance s'exécute dans votre navigateur",
          body: [
            "Votre document n'est pas envoyé à un serveur pour être lu. La reconnaissance a lieu sur votre propre machine : le contenu du fichier n'atteint jamais nos journaux et n'est jamais placé dans une file de traitement.",
            "Les seules requêtes réseau pendant une conversion concernent le moteur de reconnaissance et ses fichiers de langue, qui sont des ressources statiques.",
          ],
        },
        {
          id: "what-is-stored",
          title: "Ce qui est conservé",
          body: [
            "Un enregistrement de conversion — nom du fichier, taille, nombre de pages et issue — est écrit sur votre compte, car c'est ce qui sert à mesurer le quota gratuit. Le contenu du document n'en fait pas partie.",
            "Cet enregistrement est protégé par la sécurité au niveau des lignes en base : la demande d'un autre compte connecté portant sur votre enregistrement ne renvoie rien du tout. Il n'existe aucun chemin de lecture partagée.",
          ],
        },
        {
          id: "deletion",
          title: "Supprimer vos données",
          body: [
            "Supprimez un enregistrement depuis votre tableau de bord, ou l'intégralité du compte depuis les paramètres. La suppression du compte efface immédiatement et définitivement votre profil et votre historique de conversions.",
          ],
        },
      ],
    },
    {
      slug: "file-converters",
      title: "Convertisseurs de fichiers",
      summary:
        "PDF vers Word, Image vers Word et Image vers PDF — ce qu'ils font et leurs limites.",
      sections: [
        {
          id: "pdf-to-word",
          title: "PDF vers Word",
          body: [
            "Convertit un PDF en fichier .docx modifiable. Les pages dotées d'une couche texte sont lues directement ; les pages numérisées passent par la reconnaissance. Un document qui mêle les deux est traité page par page.",
            "Paragraphes, titres, listes à puces ou numérotées et tableaux alignés en colonnes sont reconstitués, et l'ordre des pages est conservé.",
            "La mise en page exacte n'est pas reproduite : les pages multicolonnes deviennent un ordre de lecture unique, et les éléments décoratifs, logos et polices précises ne sont pas repris.",
          ],
        },
        {
          id: "image-to-word",
          title: "Image vers Word",
          body: [
            "Transforme une ou plusieurs images JPG, PNG ou WebP en fichier .docx. Les images peuvent être réordonnées, pivotées et supprimées avant la conversion, et l'ordre affiché est celui du document.",
            "Deux sorties sont proposées. Le texte reconnu produit un contenu modifiable que vous pouvez corriger avant écriture. L'insertion des images d'origine place chaque cliché sur sa propre page, ce qui convient lorsque la page elle-même fait foi — un formulaire signé, une facture tamponnée.",
          ],
        },
        {
          id: "image-to-pdf",
          title: "Image vers PDF",
          body: [
            "Réunit des images en un seul PDF entièrement dans votre navigateur. Format de page (automatique, A4 ou Letter), orientation, marges, ajustement de l'image et qualité de sortie sont tous sous votre contrôle.",
            "Les pages sont des images : le résultat n'est donc pas consultable par recherche. Utilisez Image vers Word lorsque c'est le texte qui vous intéresse.",
          ],
        },
      ],
    },
    {
      slug: "plans-and-billing",
      title: "Formules, conversions gratuites et facturation",
      summary: "Fonctionnement des cinq conversions gratuites et des abonnements PayPal.",
      sections: [
        {
          id: "trial",
          title: "Cinq conversions gratuites",
          body: [
            "Chaque compte dispose de cinq conversions réussies, gratuites et sans carte bancaire. Elles sont communes à tous les outils plutôt qu'attribuées par produit.",
            "Il ne s'agit pas d'un quota mensuel et il ne se recharge pas : c'est une dotation unique par compte, qui exige une adresse e-mail vérifiée — le quota est accordé à un compte authentifié, non à une session de navigateur.",
            "La règle est appliquée côté serveur : elle ne peut donc pas être contournée en vidant le stockage local ou en se déconnectant. Après la cinquième conversion réussie, une formule payante devient nécessaire.",
          ],
        },
        {
          id: "allowance",
          title: "Comment le quota est décompté",
          body: [
            "Une conversion réussie compte pour une. Le décompte est réservé avant le début du traitement, de sorte que deux onglets ne peuvent pas dépenser la dernière en même temps.",
            "Une conversion qui échoue, qui est annulée, qui ne renvoie rien ou qui bute sur un fichier corrompu ne coûte rien : la réservation est libérée. Relancer la même conversion réutilise sa réservation au lieu de facturer deux fois.",
          ],
        },
        {
          id: "subscriptions",
          title: "Abonnements et résiliation",
          body: [
            "Les formules payantes sont facturées via PayPal. Un abonnement ne devient actif qu'une fois confirmé par PayPal : valider dans la fenêtre PayPal ne suffit pas à débloquer la formule.",
            "La résiliation se fait via PayPal depuis la page de facturation. L'accès se poursuit jusqu'à la fin de la période déjà réglée.",
          ],
        },
        {
          id: "advertising",
          title: "Publicité",
          body: [
            "La publicité est actuellement désactivée sur l'ensemble du site. Si elle est activée plus tard, les comptes gratuits pourront en voir sur les pages publiques de contenu uniquement — jamais dans une zone d'envoi, à côté d'une commande de conversion ou de téléchargement, ni sur les pages de compte, de facturation ou légales. Les comptes Pro et Business payants n'en verraient pas du tout.",
            "La publicité exigerait également votre consentement, modifiable à tout moment depuis les paramètres des cookies dans le pied de page.",
          ],
        },
      ],
    },
  ],

  helpCategories: [
    "Premiers pas",
    "Envois et formats",
    "Précision",
    "Exports",
    "Compte et facturation",
    "Confidentialité et sécurité",
  ],

  helpArticles: [
    {
      slug: "first-document",
      category: "Premiers pas",
      question: "Comment traiter mon premier document ?",
      answer: [
        "Créez un compte et confirmez votre adresse e-mail, puis ouvrez n'importe quelle page produit, déposez un fichier sur la zone d'envoi et patientez quelques secondes.",
        "Relisez les champs signalés comme peu sûrs, corrigez ce qui a été mal lu, puis exportez. Un compte est nécessaire : les conversions y sont décomptées.",
      ],
    },
    {
      slug: "which-file-types",
      category: "Envois et formats",
      question: "Quels types de fichiers puis-je envoyer ?",
      answer: [
        "PDF, JPG, PNG et WebP, jusqu'à 20 Mo par fichier. Les PDF peuvent être en texte natif ou numérisés, et comporter plusieurs pages.",
        "Une photo HEIC prise sur iPhone doit d'abord être exportée en JPG : le format HEIC n'est pas accepté.",
      ],
    },
    {
      slug: "file-too-large",
      category: "Envois et formats",
      question: "Mon fichier est refusé car trop volumineux. Que faire ?",
      answer: [
        "La limite est de 20 Mo. Numérisez à 300 ppp plutôt qu'à 600, ou scindez un PDF long en plusieurs fichiers. Numériser en niveaux de gris plutôt qu'en couleur divise généralement la taille par deux sans perte de précision.",
      ],
    },
    {
      slug: "convert-pdf-to-word",
      category: "Envois et formats",
      question: "Comment convertir un PDF en fichier Word modifiable ?",
      answer: [
        "Ouvrez PDF vers Word, déposez le PDF sur la zone d'envoi et patientez pendant la lecture. Les pages numérisées demandent quelques secondes de plus, le texte devant être reconnu.",
        "Le texte reconnu s'affiche pour relecture — corrigez ce qui a été mal lu — et le fichier .docx est construit à partir de ce que vous avez validé.",
      ],
    },
    {
      slug: "improve-accuracy",
      category: "Précision",
      question: "Comment améliorer la précision de l'extraction ?",
      answer: [
        "Photographiez les documents à plat, sous une lumière homogène, les quatre coins visibles. Évitez les ombres en travers de la ligne du total.",
        "Pour les numérisations, 300 ppp en niveaux de gris ou en noir et blanc est idéal. Les reçus froissés se lisent mieux aplatis sous une vitre.",
      ],
    },
    {
      slug: "wrong-total",
      category: "Précision",
      question: "Un total a été mal lu. Que faire ?",
      answer: [
        "Cliquez sur le champ dans le tableau de résultats et saisissez la valeur correcte. C'est la valeur corrigée qui est exportée, et les totaux se recalculent autour d'elle.",
        "Vos documents ne servent à entraîner aucun modèle. Si un type de document est systématiquement mal lu, décrivez le problème via la page Contact — n'envoyez pas le document lui-même.",
      ],
    },
    {
      slug: "word-layout-differs",
      category: "Précision",
      question: "Pourquoi mon fichier Word ne ressemble-t-il pas exactement au PDF ?",
      answer: [
        "Les convertisseurs visent un contenu modifiable dans le bon ordre — paragraphes, titres, listes et tableaux — et non une copie au pixel près. Les mises en page multicolonnes deviennent un ordre de lecture unique, et les éléments décoratifs, polices exactes et espacements ne sont pas repris.",
        "Lorsque l'apparence compte plus que le texte, Image vers Word peut insérer l'image d'origine à la place du texte reconnu.",
      ],
    },
    {
      slug: "excel-arabic",
      category: "Exports",
      question: "Le texte arabe s'affiche mal quand j'ouvre le CSV dans Excel.",
      answer: [
        "Nos fichiers CSV sont en UTF-8 avec indicateur d'ordre des octets, qu'Excel interprète correctement. Si le fichier a été réenregistré depuis un autre outil, cet indicateur a pu être retiré : réexportez et ouvrez le nouveau fichier.",
        "L'export .xlsx ne dépend pas des réglages de jeu de caractères ; c'est le choix le plus sûr pour les écritures non latines.",
      ],
    },
    {
      slug: "export-formats",
      category: "Exports",
      question: "Quels formats d'export sont disponibles ?",
      answer: [
        "Excel (.xlsx) avec une feuille de synthèse et une feuille de lignes, CSV des lignes, et JSON pour les systèmes qui consomment l'enregistrement brut. Les trois sont générés dans votre navigateur.",
      ],
    },
    {
      slug: "free-plan",
      category: "Compte et facturation",
      question: "Qu'obtient-on gratuitement ?",
      answer: [
        "Cinq conversions réussies par compte, communes à tous les outils, avec tous les formats d'export. Aucune carte bancaire n'est demandée.",
        "C'est une dotation unique et non un quota mensuel : elle ne se recharge pas et exige une adresse e-mail vérifiée. Les conversions échouées ou annulées ne sont pas décomptées.",
      ],
    },
    {
      slug: "trial-ended",
      category: "Compte et facturation",
      question: "J'ai utilisé mes cinq conversions. Que se passe-t-il ?",
      answer: [
        "Rien n'est supprimé. Votre compte reste ouvert et vous pouvez toujours vous connecter, consulter votre formule et gérer votre historique.",
        "Les nouvelles conversions nécessitent un abonnement payant. Les formules Pro et Business figurent sur la page des formules.",
      ],
    },
    {
      slug: "forgot-password",
      category: "Compte et facturation",
      question: "J'ai oublié mon mot de passe.",
      answer: [
        "Utilisez le lien « Mot de passe oublié ? » sur la page de connexion. Si un compte existe pour l'adresse saisie, un lien de réinitialisation arrive en quelques minutes. Ce lien est à usage unique et expire au bout d'une heure.",
      ],
    },
    {
      slug: "change-email",
      category: "Compte et facturation",
      question: "Puis-je changer mon adresse e-mail ?",
      answer: [
        "L'adresse d'un compte ne peut pas être modifiée pour l'instant. Créez un compte avec la nouvelle adresse et supprimez l'ancien depuis les paramètres une fois la bascule effectuée.",
      ],
    },
    {
      slug: "no-ads-paid",
      category: "Compte et facturation",
      question: "Verrai-je de la publicité ?",
      answer: [
        "La publicité est désactivée sur tout le site pour le moment : personne n'en voit.",
        "Si elle était activée plus tard, les comptes Pro et Business payants n'en verraient toujours pas, et les comptes gratuits uniquement sur les pages publiques de contenu — jamais dans une zone d'envoi, à côté d'un bouton de conversion ou de téléchargement, ni sur les pages de compte, de facturation ou légales. Elle exigerait aussi votre consentement.",
      ],
    },
    {
      slug: "converter-privacy",
      category: "Confidentialité et sécurité",
      question: "Mes fichiers sont-ils envoyés lors d'une conversion ?",
      answer: [
        "Non. La reconnaissance et la conversion s'exécutent dans votre navigateur, et votre fichier n'est jamais transmis à nous ni à un tiers pour être lu.",
        "La conversion elle-même est enregistrée — nom du fichier, taille, nombre de pages et issue — car c'est ce qui sert à mesurer le quota gratuit. Le contenu de votre document n'est jamais conservé ni journalisé.",
      ],
    },
    {
      slug: "who-can-see",
      category: "Confidentialité et sécurité",
      question: "Quelqu'un d'autre peut-il voir mes documents ?",
      answer: [
        "Vos documents ne sont pas envoyés : il n'y a donc rien à lire de notre côté.",
        "Les enregistrements de conversion conservés sont rattachés au compte qui les a créés et protégés par la sécurité au niveau des lignes en base : un autre compte connecté qui demande votre enregistrement reçoit un résultat vide.",
      ],
    },
    {
      slug: "delete-account",
      category: "Confidentialité et sécurité",
      question: "Comment supprimer mon compte et mes données ?",
      answer: [
        "Ouvrez les paramètres du compte, descendez jusqu'à « Supprimer le compte », saisissez DELETE pour confirmer et validez. Votre profil et votre historique de conversions sont effacés immédiatement et définitivement.",
      ],
    },
  ],

  ui: {
    docTitle: "Documentation — le fonctionnement d'EasyInvoiceOCR",
    docDescription:
      "Créer un compte, lancer une conversion, lire les indices de confiance, exporter en Excel, CSV ou JSON, et ce qui est conservé. Formats acceptés, langues et quota gratuit.",
    docHeading: "Documentation",
    docLede:
      "Ce que le produit fait réellement, et où il s'arrête. La reconnaissance s'exécute dans votre navigateur ; les limites décrites ici sont celles appliquées dans le code.",
    docEyebrow: "Ressources",
    docBreadcrumb: "Documentation",
    onThisPage: "Sur cette page",

    helpTitle: "Centre d'aide — réponses aux questions courantes",
    helpDescription:
      "Réponses sur les envois, la taille des fichiers, la précision, les exports Excel et CSV, les cinq conversions gratuites, la facturation, la suppression de compte et le lieu de traitement.",
    helpHeading: "Centre d'aide",
    helpLede: "Des réponses courtes aux questions qu'on nous pose vraiment.",
    helpEyebrow: "Ressources",
    helpBreadcrumb: "Centre d'aide",
    searchLabel: "Rechercher dans les articles d'aide",
    searchPlaceholder: "Rechercher une question…",
    allCategories: "Tout",
    noResults: "Aucun article ne correspond à cette recherche.",
    noResultsHint: "Essayez une formulation plus courte, ou parcourez une catégorie ci-dessus.",
    errorState: "Cette page n'a pas pu être chargée.",

    relatedTitle: "À consulter",
    relatedLinks: [
      { label: "Extraire les données d'une facture", href: "/fr/invoice-ocr" },
      { label: "Comment les documents sont traités", href: "/fr/security" },
      {
        label: "Ce que mesure une annonce de précision",
        href: "/fr/blog/invoice-ocr-accuracy-guide",
      },
      {
        label: "Les questions à poser à tout prestataire documentaire",
        href: "/fr/blog/gdpr-document-processing",
      },
    ],
    ctaLabel: "Essayer une conversion",
    ctaHref: "/fr/invoice-ocr",
    ctaNote: "Cinq conversions offertes. Une conversion qui échoue n'en consomme aucune.",
  },
};
