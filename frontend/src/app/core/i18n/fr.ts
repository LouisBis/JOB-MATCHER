export const LABELS = {
  offers: {
    pageTitle: 'Offres d\'emploi',
    loading: 'Chargement des offres…',
    empty: 'Aucune offre disponible. Lancez une analyse depuis le backend.',
    loadError: 'Impossible de charger les offres. Vérifiez que le backend est démarré.',
    notFound: 'Offre introuvable.',
    backToList: '← Retour aux offres',
    viewOffer: 'Voir l\'annonce',
    publishedOn: 'Publiée le',
    fetchedOn: 'Récupérée le',
    llmSummary: 'Analyse LLM',
    description: 'Description',
  },
  source: {
    indeed: 'Indeed',
    'france-travail': 'France Travail',
  } as Record<string, string>,
  contract: {
    cdi: 'CDI',
    cdd: 'CDD',
    freelance: 'Freelance',
    stage: 'Stage',
    alternance: 'Alternance',
  },
  preferences: {
    pageTitle: 'Préférences',
    saveSuccess: 'Préférences enregistrées.',
    saveError: 'Erreur lors de l\'enregistrement des préférences.',
  },
  nav: {
    offers: 'Offres',
    preferences: 'Préférences',
  },
} as const;
