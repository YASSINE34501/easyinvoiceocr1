import type { PdfToolsContent } from "./types";

/**
 * Copie française des outils PDF.
 *
 * Traduction complète, pas un repli sur l'anglais : une chaîne manquante ici
 * est une erreur de type, pas une page à moitié traduite. Les limites décrites
 * sont celles du code réel — le rognage réversible, les chiffres arabo-indiens
 * absents — et non une version adoucie pour le marketing.
 */
export const pdfToolsFr: PdfToolsContent = {
  index: {
    title: "Outils PDF gratuits — Fusionner, diviser, pivoter, organiser | EasyInvoiceOCR",
    description:
      "Huit outils PDF qui fonctionnent entièrement dans votre navigateur : fusionner, diviser, supprimer, extraire, réorganiser, pivoter, rogner et numéroter des pages. Sans envoi, sans compte, sans filigrane.",
    eyebrow: "Outils PDF",
    h1: "Des outils PDF qui tournent dans votre navigateur",
    lede: "Fusionnez, divisez, réorganisez, pivotez, rognez et numérotez les pages d'un PDF. Votre fichier ne quitte jamais votre appareil : tout se passe dans cet onglet, il n'y a donc rien à envoyer et rien à conserver de notre côté.",
    categories: {
      organise: {
        title: "Organiser les pages",
        lede: "Réunir plusieurs documents, en découper un, et décider quelles pages restent et dans quel ordre.",
      },
      edit: {
        title: "Modifier les pages",
        lede: "Changer la présentation des pages elles-mêmes : leur orientation, leurs marges, leur numérotation.",
      },
    },
    privacy: {
      title: "Votre document reste sur votre appareil",
      body: [
        "Tous les outils de cette page s'exécutent dans votre navigateur. Le fichier est lu dans la mémoire de l'onglet, modifié sur place, puis vous est rendu sous forme de téléchargement. Il n'est jamais envoyé à nos serveurs, car ces pages n'ont tout simplement aucun canal d'envoi.",
        "Cela signifie aussi que nous ne pouvons récupérer aucun fichier pour vous, et que fermer l'onglet efface tout. Conservez votre original tant que vous n'avez pas vérifié le résultat.",
      ],
    },
    faqs: [
      {
        q: "Faut-il un compte pour utiliser ces outils ?",
        a: "Non. Les outils PDF sont gratuits et ne demandent aucune connexion. Un compte n'est nécessaire que pour l'extraction de factures et de reçus, qui est soumise à un quota.",
      },
      {
        q: "Y a-t-il un filigrane sur le résultat ?",
        a: "Non. Les outils écrivent un PDF normal, sans rien ajouter au-delà de ce que vous avez demandé.",
      },
      {
        q: "Quelle taille de fichier puis-je traiter ?",
        a: "Jusqu'à 100 Mo et 2 000 pages. Au-delà, un onglet de navigateur finit par manquer de mémoire en cours de route, ce qui échoue salement plutôt que proprement.",
      },
      {
        q: "Ces outils ouvrent-ils un PDF protégé par mot de passe ?",
        a: "Non. Un document chiffré est refusé, pas contourné. Retirez le mot de passe dans l'application qui l'a posé, puis revenez.",
      },
    ],
  },

  ui: {
    dropTitle: "Déposez vos fichiers PDF ici",
    chooseFiles: "Choisir des fichiers PDF",
    run: "Lancer",
    running: "Traitement…",
    reading: "Lecture du document…",
    done: "Terminé",
    download: "Télécharger",
    downloadAll: "Tout télécharger (.zip)",
    startOver: "Recommencer",
    addFiles: "Ajouter des fichiers",
    removeFile: "Retirer",
    moveUp: "Monter",
    moveDown: "Descendre",
    duplicate: "Dupliquer",
    restore: "Rétablir toutes les pages",
    files: "Fichiers",
    orderHint:
      "La fusion suit l'ordre de la liste, de haut en bas. Réorganisez-la si ce n'est pas l'ordre voulu.",
    pageCount: "{count} pages",
    pagesLabel: "Pages",
    pagesHint:
      "Pages isolées et plages, par exemple 1-3, 7, 9-. Laissez vide pour toutes les pages.",
    pagesAll: "Toutes les pages",
    selectedPages: "Sélection : {pages}",
    angle: "Pivoter de",
    angle90: "90° dans le sens horaire",
    angle180: "180°",
    angle270: "90° dans le sens antihoraire",
    splitMode: "Diviser en",
    splitEach: "Un fichier par page",
    splitFixed: "Groupes de taille fixe",
    groupSize: "Pages par fichier",
    position: "Position",
    positionBottomCenter: "En bas au centre",
    positionBottomLeft: "En bas à gauche",
    positionBottomRight: "En bas à droite",
    positionTopCenter: "En haut au centre",
    positionTopLeft: "En haut à gauche",
    positionTopRight: "En haut à droite",
    startAt: "Commencer la numérotation à",
    fontSize: "Taille du texte",
    numberFormat: "Format",
    numberFormatHint: "{n} est le numéro, {total} le nombre de pages.",
    margins: "Marges à rogner",
    marginsHint:
      "En points — 72 points font un pouce. La zone rognée est masquée, pas supprimée : le rognage peut être annulé dans n'importe quel éditeur PDF.",
    marginTop: "Haut",
    marginRight: "Droite",
    marginBottom: "Bas",
    marginLeft: "Gauche",
    page: "Page {n}",
    outputFiles: "{count} fichiers",
    outputSize: "Taille",
    pagesIn: "Pages en entrée",
    pagesOut: "Pages en sortie",
    privacyTitle: "Rien n'est envoyé",
    privacyBody:
      "Le traitement a lieu dans votre navigateur. Le fichier n'est envoyé nulle part et nous n'en gardons aucune copie.",
    errorTitle: "Cela n'a pas fonctionné",
    howItWorks: "Comment ça marche",
    limitsTitle: "Ce que l'outil ne fait pas",
    faqTitle: "Questions",
    otherTools: "Autres outils PDF",
    allTools: "Tous les outils PDF",
  },

  errors: {
    file_empty: "Ce fichier est vide.",
    file_too_large: "Ce fichier dépasse 100 Mo. Divisez-le d'abord.",
    no_files: "Choisissez un fichier pour commencer.",
    not_a_pdf: "Ce n'est pas un PDF. Les outils de cette page ne lisent que des fichiers PDF.",
    too_many_files: "Cela fait plus de 20 fichiers. Procédez en deux fois.",
    need_two_files: "Une fusion demande au moins deux fichiers.",
    pdf_corrupt: "Ce PDF n'a pas pu être lu. Il est peut-être endommagé ou incomplet.",
    pdf_encrypted:
      "Ce PDF est protégé par mot de passe. Retirez le mot de passe dans l'application qui l'a posé, puis réessayez.",
    pdf_no_pages: "Ce PDF ne contient aucune page.",
    pdf_too_many_pages:
      "Ce PDF dépasse 2 000 pages, soit plus qu'un onglet de navigateur ne peut contenir.",
    selection_empty: "Aucune page n'est sélectionnée.",
    selection_invalid:
      "Cette sélection de pages n'a pas pu être lue. Utilisez une forme comme 1-3, 7, 9-.",
    selection_out_of_range: "Cette sélection désigne une page que le document ne contient pas.",
    would_remove_every_page: "Cela ne laisserait plus aucune page dans le document.",
    crop_invalid: "Les marges doivent être supérieures ou égales à zéro.",
    crop_too_large: "Ces marges rogneraient la page en entier.",
    font_invalid: "Ce fichier de police n'a pas pu être intégré.",
    font_missing_glyphs:
      "La police intégrée n'a pas de glyphe pour l'un de ces caractères. Utilisez des chiffres occidentaux ou du texte latin simple.",
    font_size_invalid: "La taille du texte doit être comprise entre 4 et 96.",
    output_invalid:
      "Le résultat n'était pas un PDF lisible ; il n'a donc pas été proposé au téléchargement. Rien n'a été modifié sur votre appareil.",
    unknown: "Une erreur est survenue. Votre fichier n'a pas été modifié.",
  },

  tools: {
    "merge-pdf": {
      name: "Fusionner PDF",
      title: "Fusionner des PDF — Réunir plusieurs fichiers | EasyInvoiceOCR",
      description:
        "Réunissez deux PDF ou plus en un seul fichier, dans l'ordre de votre choix. Traitement dans votre navigateur : aucun envoi, aucun filigrane.",
      h1: "Fusionner des fichiers PDF",
      lede: "Réunissez jusqu'à 20 PDF en un seul document. Mettez les fichiers dans l'ordre voulu avant de lancer la fusion.",
      card: "Réunir plusieurs PDF en un seul, dans l'ordre de votre choix.",
      steps: [
        {
          title: "Choisir les fichiers",
          body: "Sélectionnez deux PDF ou plus, ou déposez-les sur la page. L'en-tête PDF de chacun est vérifié avant toute autre opération.",
        },
        {
          title: "Les mettre dans l'ordre",
          body: "La liste donne l'ordre de fusion. Montez ou descendez un fichier jusqu'à obtenir la lecture souhaitée.",
        },
        {
          title: "Fusionner et télécharger",
          body: "Les pages sont copiées document par document, chacune conservant sa taille et sa rotation. Le résultat est rouvert et vérifié avant de vous être proposé.",
        },
      ],
      faqs: [
        {
          q: "La fusion dégrade-t-elle la qualité des pages ?",
          a: "Non. Les pages sont copiées telles quelles — mêmes polices, mêmes images, mêmes formats. Rien n'est ré-encodé.",
        },
        {
          q: "Puis-je fusionner des documents de formats différents ?",
          a: "Oui. Chaque page conserve son format : un document A4 et un tableau en paysage peuvent cohabiter dans le même fichier.",
        },
        {
          q: "Que deviennent les signets et les champs de formulaire ?",
          a: "Le contenu, la taille et la rotation des pages sont conservés. Les structures propres au document — plan, champs de formulaire, pièces jointes — ne le sont pas.",
        },
      ],
      limits: [
        "Les signets, champs de formulaire, annotations et pièces jointes ne sont pas repris dans le fichier fusionné.",
        "Jusqu'à 20 fichiers et 2 000 pages au total.",
      ],
    },

    "split-pdf": {
      name: "Diviser PDF",
      title: "Diviser un PDF — Le découper en plusieurs fichiers | EasyInvoiceOCR",
      description:
        "Divisez un PDF en un fichier par page ou en groupes de taille fixe. Traitement dans votre navigateur : sans envoi, sans compte, sans filigrane.",
      h1: "Diviser un PDF",
      lede: "Découpez un document en plusieurs — un fichier par page, ou des groupes de la taille de votre choix. Au-delà d'un fichier, le résultat arrive en zip.",
      card: "Découper un PDF en pages isolées ou en groupes de taille fixe.",
      steps: [
        {
          title: "Choisir le document",
          body: "Le nombre de pages est lu directement dans le fichier : vous voyez ce que vous manipulez avant de décider du découpage.",
        },
        {
          title: "Choisir le mode de découpe",
          body: "Un fichier par page, ou des groupes de taille fixe. Un document de 10 pages découpé par quatre donne 4, 4 puis 2.",
        },
        {
          title: "Télécharger les parties",
          body: "Les parties portent un numéro sur deux chiffres — rapport-01.pdf, rapport-02.pdf — afin de se trier correctement dans un gestionnaire de fichiers. Plusieurs parties arrivent dans un seul zip.",
        },
      ],
      faqs: [
        {
          q: "Comment les fichiers obtenus sont-ils nommés ?",
          a: "D'après l'original, suivi d'un numéro de partie sur deux chiffres : rapport.pdf devient rapport-01.pdf, rapport-02.pdf, etc.",
        },
        {
          q: "Pourquoi le téléchargement est-il un zip ?",
          a: "Parce qu'un navigateur ne peut pas lancer plusieurs téléchargements de façon fiable. Une découpe ne produisant qu'un fichier vous le remet directement.",
        },
        {
          q: "Puis-je découper à des pages précises ?",
          a: "Pour un ensemble de pages précis, utilisez Extraire des pages : l'outil produit un document contenant exactement les pages nommées.",
        },
      ],
      limits: [
        "La découpe à des points choisis librement n'est pas proposée ici ; Extraire des pages couvre ce cas.",
        "Chaque partie est un document neuf : les structures propres au document, comme les signets, ne sont pas reprises.",
      ],
    },

    "remove-pages": {
      name: "Supprimer des pages",
      title: "Supprimer des pages d'un PDF | EasyInvoiceOCR",
      description:
        "Supprimez des pages d'un PDF et gardez le reste. Traitement dans votre navigateur : aucun envoi, et votre fichier d'origine reste intact.",
      h1: "Supprimer des pages d'un PDF",
      lede: "Nommez les pages dont vous ne voulez pas et gardez les autres. Votre fichier d'origine n'est pas modifié : vous récupérez un nouveau document.",
      card: "Supprimer les pages nommées et garder tout le reste.",
      steps: [
        {
          title: "Choisir le document",
          body: "Son nombre de pages est lu d'abord : une sélection qui désigne une page au-delà de la fin est repérée avant toute écriture.",
        },
        {
          title: "Nommer les pages à retirer",
          body: "Pages isolées et plages : 2, ou 5-9, ou 1-3, 12. Tout ce que vous ne nommez pas est conservé, dans l'ordre d'origine.",
        },
        {
          title: "Télécharger le résultat",
          body: "Le nouveau document est rouvert et son nombre de pages comparé à votre demande avant d'être proposé au téléchargement.",
        },
      ],
      faqs: [
        {
          q: "Mon fichier d'origine est-il modifié ?",
          a: "Non. Rien n'est écrit sur votre appareil, hormis le fichier que vous choisissez de télécharger.",
        },
        {
          q: "Et si je supprime toutes les pages ?",
          a: "C'est refusé. Un PDF sans page n'est pas un document valide : l'outil s'arrête plutôt que de vous remettre un fichier qui ne s'ouvrira pas.",
        },
      ],
      limits: [
        "Le résultat ne peut pas être vide : au moins une page doit rester.",
        "Les signets et les champs de formulaire ne sont pas repris dans le nouveau document.",
      ],
    },

    "extract-pages": {
      name: "Extraire des pages",
      title: "Extraire des pages d'un PDF | EasyInvoiceOCR",
      description:
        "Sortez des pages choisies d'un PDF vers un nouveau document. Traitement dans votre navigateur : sans envoi, sans compte, sans filigrane.",
      h1: "Extraire des pages d'un PDF",
      lede: "Gardez exactement les pages que vous nommez, et rien d'autre. Pratique pour sortir une facture d'un mois entier.",
      card: "Sortir les pages nommées vers un nouveau document.",
      steps: [
        {
          title: "Choisir le document",
          body: "Le nombre de pages est lu dans le fichier lui-même, pas déduit de sa taille.",
        },
        {
          title: "Nommer les pages à garder",
          body: "Plages et pages isolées, dans n'importe quel ordre : 1-3, 7, 9-. Elles ressortent en ordre croissant, chacune une seule fois.",
        },
        {
          title: "Télécharger l'extrait",
          body: "Un nouveau PDF contenant uniquement ces pages, vérifié comme lisible avant de vous être remis.",
        },
      ],
      faqs: [
        {
          q: "Quelle différence avec Supprimer des pages ?",
          a: "Les deux sont opposés. Extraire garde ce que vous nommez ; Supprimer garde ce que vous ne nommez pas. Prenez la liste la plus courte à saisir.",
        },
        {
          q: "Puis-je extraire deux fois la même page ?",
          a: "Pas ici : une sélection est un ensemble, une page répétée n'apparaît qu'une fois. Organiser le PDF permet de répéter une page.",
        },
      ],
      limits: [
        "La sélection est dédoublonnée et triée ; utilisez Organiser le PDF pour un ordre libre ou une page répétée.",
        "Les signets et les champs de formulaire ne sont pas repris dans le nouveau document.",
      ],
    },

    "organize-pdf": {
      name: "Organiser le PDF",
      title: "Organiser un PDF — Réordonner, dupliquer, retirer des pages | EasyInvoiceOCR",
      description:
        "Mettez les pages d'un PDF dans l'ordre voulu, dupliquez-en une, ou retirez-la. Traitement dans votre navigateur : aucun envoi.",
      h1: "Organiser les pages d'un PDF",
      lede: "Déplacez des pages, répétez-en une, ou retirez-en une. La liste ci-dessous est exactement ce que contiendra le document final, de haut en bas.",
      card: "Réordonner, dupliquer ou retirer des pages une à une.",
      steps: [
        {
          title: "Choisir le document",
          body: "Chaque page est listée avec son numéro d'origine, sa taille et la rotation qu'elle porte déjà.",
        },
        {
          title: "Arranger les pages",
          body: "Montez ou descendez une page, dupliquez-la, ou retirez-la. L'ordre de la liste est l'ordre du résultat : aucun tri n'est appliqué ensuite.",
        },
        {
          title: "Construire et télécharger",
          body: "Les pages sont copiées exactement dans cet ordre, et le résultat est vérifié avant de vous être proposé.",
        },
      ],
      faqs: [
        {
          q: "Puis-je placer deux fois la même page ?",
          a: "Oui. Dupliquer une page est un besoin courant — une page de garde, des conditions répétées — donc c'est permis ici, contrairement à l'extraction.",
        },
        {
          q: "Les vignettes des pages sont-elles affichées ?",
          a: "Pas dans cette version. Les pages sont listées par numéro, taille et rotation plutôt qu'en images : rien n'a besoin d'être rendu avant que vous puissiez travailler.",
        },
      ],
      limits: [
        "Les pages apparaissent sous forme de liste numérotée, pas de vignettes.",
        "La liste ne peut pas être vidée : un document a besoin d'au moins une page.",
      ],
    },

    "rotate-pdf": {
      name: "Pivoter le PDF",
      title: "Pivoter des pages PDF — Redresser un scan de travers | EasyInvoiceOCR",
      description:
        "Pivotez des pages PDF de 90, 180 ou 270 degrés, toutes ou seulement celles que vous nommez. Traitement dans votre navigateur.",
      h1: "Pivoter des pages PDF",
      lede: "Remettez un scan de travers à l'endroit. Pivotez tout le document, ou seulement les pages qui en ont besoin.",
      card: "Pivoter des pages de 90, 180 ou 270 degrés.",
      steps: [
        {
          title: "Choisir le document",
          body: "La rotation actuelle de chaque page est lue dans le fichier : vous voyez lesquelles sont déjà tournées.",
        },
        {
          title: "Choisir les pages et l'angle",
          body: "Laissez la sélection vide pour tout pivoter, ou nommez les pages de travers. Choisissez un quart de tour dans un sens ou l'autre, ou un demi-tour.",
        },
        {
          title: "Télécharger le résultat",
          body: "La rotation s'ajoute à celle que la page portait déjà : un scan déjà tourné arrive là où vous l'attendez, au lieu de se caler sur un angle fixe.",
        },
      ],
      faqs: [
        {
          q: "Pivoter ré-encode-t-il la page ?",
          a: "Non. Une page PDF porte une valeur de rotation, et c'est cette valeur qui change. Le contenu reste intact : aucune perte de qualité, et la taille du fichier bouge à peine.",
        },
        {
          q: "Pourquoi pivoter une page déjà tournée ne donne-t-il pas 90° ?",
          a: "Parce que la rotation est relative. Faire pivoter de 90° une page déjà à 90° donne 180°, comme si vous la tourniez entre vos mains.",
        },
      ],
      limits: [
        "Uniquement des quarts et des demi-tours : la rotation d'une page PDF est définie en multiples de 90°.",
        "La rotation s'applique à des pages entières ; les images d'une page ne peuvent pas être tournées séparément.",
      ],
    },

    "crop-pdf": {
      name: "Rogner le PDF",
      title: "Rogner un PDF — Couper les marges des pages | EasyInvoiceOCR",
      description:
        "Coupez les marges des pages d'un PDF en définissant une zone de rognage. Traitement dans votre navigateur, et le rognage reste réversible.",
      h1: "Rogner des pages PDF",
      lede: "Coupez les marges blanches d'un scan pour que le contenu remplisse la page. La zone rognée est masquée, pas supprimée : rien n'est perdu.",
      card: "Couper les marges en définissant une zone de rognage.",
      steps: [
        {
          title: "Choisir le document",
          body: "La taille de chaque page est lue en points, l'unité dans laquelle les marges sont exprimées — 72 points pour un pouce.",
        },
        {
          title: "Définir les marges",
          body: "Ce qu'il faut couper de chaque bord. Un rognage qui ne laisserait rien est refusé : une page d'aire nulle s'affiche blanche chez certains lecteurs et provoque une erreur chez d'autres.",
        },
        {
          title: "Télécharger le résultat",
          body: "La zone de rognage est définie et la zone média laissée intacte : c'est ce qui rend le rognage réversible.",
        },
      ],
      faqs: [
        {
          q: "Le contenu rogné est-il supprimé ?",
          a: "Non. Rogner un PDF définit une zone de rognage, c'est-à-dire une indication au lecteur sur la partie de page à afficher. Le contenu extérieur reste dans le fichier et revient si l'on réinitialise cette zone.",
        },
        {
          q: "Le rognage réduit-il la taille du fichier ?",
          a: "À peine. Rien n'est retiré, donc la taille reste à peu près la même. S'il vous faut un fichier réellement plus léger, le rognage n'est pas le bon outil.",
        },
        {
          q: "Puis-je rogner chaque page différemment ?",
          a: "Pas en une seule passe. Lancez l'outil une fois par groupe de pages partageant les mêmes marges, en nommant ces pages à chaque fois.",
        },
      ],
      limits: [
        "Le rognage est réversible : il ne supprime donc pas un contenu sensible et n'allège pas le fichier.",
        "Un seul jeu de marges par passe ; des pages aux marges différentes demandent plusieurs passes.",
        "Pas d'aperçu visuel : les marges se saisissent en points.",
      ],
    },

    "page-numbers": {
      name: "Numéros de page",
      title: "Ajouter des numéros de page à un PDF | EasyInvoiceOCR",
      description:
        "Apposez des numéros de page sur un PDF, à la position et au format de votre choix. Traitement dans votre navigateur : aucun envoi.",
      h1: "Ajouter des numéros de page à un PDF",
      lede: "Apposez un numéro sur chaque page, où vous voulez et au format voulu. Numérotez tout le document ou seulement une partie.",
      card: "Apposer des numéros sur les pages, à la position voulue.",
      steps: [
        {
          title: "Choisir le document",
          body: "Les tailles de page sont lues d'abord, car le numéro est placé par rapport aux bords de chaque page et non d'un A4 supposé.",
        },
        {
          title: "Choisir la position et le format",
          body: "Six positions, et un format libre : {n} devient le numéro et {total} le nombre de pages, donc Page {n} sur {total} fonctionne.",
        },
        {
          title: "Télécharger le document numéroté",
          body: "Les numéros sont tracés sur les pages avec la police Helvetica intégrée, et le résultat est rouvert et vérifié avant de vous parvenir.",
        },
      ],
      faqs: [
        {
          q: "Puis-je commencer la numérotation ailleurs qu'à 1 ?",
          a: "Oui. Réglez le numéro de départ — utile quand un document en prolonge un autre, ou quand les premières pages sont des pages liminaires non numérotées.",
        },
        {
          q: "Puis-je ne numéroter qu'une partie des pages ?",
          a: "Oui. Nommez les pages : la numérotation part de votre numéro de départ sur la première d'entre elles, puis progresse.",
        },
        {
          q: "Puis-je utiliser des chiffres arabo-indiens ?",
          a: "Pas encore. Les polices intégrées ne couvrent que les caractères latins et les chiffres occidentaux. Plutôt que d'imprimer discrètement des chiffres occidentaux sur un document qui attendait ٠١٢٣, l'outil refuse — une prise en charge correcte demande une police intégrée, absente de cette version.",
        },
      ],
      limits: [
        "Chiffres occidentaux et texte latin uniquement ; les chiffres arabo-indiens demandent une police intégrée et ne sont pas encore pris en charge.",
        "Une seule position et un seul format par passe.",
        "Le numéro est tracé sur la page et ne peut plus être retiré ensuite : conservez votre original.",
      ],
    },
  },

  landing: {
    greeting: "Bonjour, nous pouvons commencer",
    greetingNamed: "Bonjour {name}, nous pouvons commencer",
    lede: "Tous les outils PDF d'EasyInvoiceOCR, au même endroit. Les outils de pages fonctionnent entièrement dans cet onglet et ne demandent aucun compte ; les produits d'extraction lisent factures et reçus vers Excel, CSV et JSON.",
    stats: [
      { value: "15", label: "outils qui fonctionnent aujourd'hui" },
      { value: "0", label: "fichier envoyé à nos serveurs" },
      { value: "3", label: "langues, dont l'arabe" },
    ],
    filterLabel: "Filtrer les outils par catégorie",
    categoryAll: "Tout",
    categories: {
      organise: "Organiser PDF",
      edit: "Modifier PDF",
      convert: "Convertir PDF",
      intelligence: "Intelligence PDF",
    },
    badges: { new: "Nouveau !", account: "Compte", soon: "Bientôt" },
    count: "{count} outils",
    empty: "Aucun outil dans cette catégorie pour l'instant.",
    waysTitle: "Travaillez à votre façon",
    waysLede:
      "Pas d'installation, pas d'extension, pas de compte pour les outils de pages. Il vous faut le navigateur que vous avez déjà ouvert.",
    ways: [
      {
        title: "Dans votre navigateur",
        body: "Les outils de pages lisent votre fichier dans cet onglet, le modifient sur place et vous le rendent. Rien à installer, aucune inscription.",
      },
      {
        title: "Sur mobile comme sur ordinateur",
        body: "Les mêmes outils et les mêmes commandes à toutes les largeurs. Rien n'est masqué sur petit écran par simple facilité.",
      },
      {
        title: "Vers les formats que vos outils lisent",
        body: "Les produits d'extraction écrivent du Word, de l'Excel, du CSV et du JSON — ce que votre comptabilité et vos tableurs ouvrent déjà.",
      },
    ],
    featuresTitle: "Conçu pour qu'on lui confie un document",
    featuresLede:
      "Les détails qui décident si un outil tient sur du travail réel et pas seulement sur un fichier de test.",
    features: [
      {
        title: "Le résultat est vérifié avant de vous parvenir",
        body: "Chaque résultat est enregistré, rouvert, et son nombre de pages comparé à votre demande. Un fichier illisible est refusé plutôt que remis.",
      },
      {
        title: "Un fichier est ce que disent ses octets",
        body: "L'en-tête PDF est lu avant toute ouverture : un document simplement renommé est arrêté à la porte, pas à l'intérieur d'un analyseur.",
      },
      {
        title: "L'arabe est une langue de premier rang",
        body: "Interface de droite à gauche, avec le champ de plages de pages maintenu de gauche à droite pour qu'une plage comme 1-3, 7 reste lisible.",
      },
      {
        title: "Les limites sont écrites",
        body: "Chaque outil dit ce qu'il ne fait pas — le rognage qui masque au lieu de supprimer, la numérotation qui exige des chiffres latins — avant que vous y passiez du temps.",
      },
    ],
    trustTitle: "Ce que nous pouvons réellement promettre",
    trust: [
      "Les outils de pages n'envoient rien. Ces pages n'ont aucun canal d'envoi.",
      "Aucun filigrane n'est ajouté, et aucun compte n'est nécessaire.",
      "Un PDF protégé par mot de passe est refusé, jamais contourné.",
      "Fermer l'onglet efface tout — nous ne pouvons récupérer aucun fichier pour vous.",
    ],
    trustLink: "Lire la page sécurité",
    ctaTitle: "Besoin d'extraire les chiffres d'un document ?",
    ctaBody:
      "Les produits d'extraction lisent factures et reçus vers un tableur. Chaque compte démarre avec cinq conversions gratuites, valables sur tous les produits.",
    ctaPrimary: "Créer un compte gratuit",
    ctaSecondary: "Voir les offres",
    ctaNote: "Les outils PDF de cette page restent gratuits et sans compte.",
  },
};
