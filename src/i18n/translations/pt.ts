export const pt = {
  // App
  appTitle: 'Calendário Familiar',
  appSubtitle: 'Organize os eventos da sua família',
  
  // Online/Offline
  online: 'Online',
  offline: 'Offline',
  pendingChanges: 'alterações pendentes',
  syncToCloud: 'Sincronizar com nuvem',
  offlineFamily: 'Família Offline',
  continueOffline: 'Continuar Offline',
  continueOfflineDescription: 'Use o app sem conta. Seus dados ficarão salvos apenas neste dispositivo.',
  offlineMode: 'Usando modo offline',
  or: 'ou',
  
  // Navigation & Actions
  save: 'Salvar',
  saving: 'Salvando...',
  cancel: 'Cancelar',
  add: 'Adicionar',
  edit: 'Editar',
  remove: 'Remover',
  confirm: 'Confirmar',
  back: 'Voltar',
  close: 'Fechar',
  delete: 'Excluir',
  create: 'Criar',
  update: 'Atualizar',
  
  // Days of week (full)
  'day-0': 'Domingo',
  'day-1': 'Segunda-feira',
  'day-2': 'Terça-feira',
  'day-3': 'Quarta-feira',
  'day-4': 'Quinta-feira',
  'day-5': 'Sexta-feira',
  'day-6': 'Sábado',
  
  // Days of week (abbreviated)
  'day-short-0': 'Dom',
  'day-short-1': 'Seg',
  'day-short-2': 'Ter',
  'day-short-3': 'Qua',
  'day-short-4': 'Qui',
  'day-short-5': 'Sex',
  'day-short-6': 'Sáb',
  
  // Months (full)
  'month-0': 'Janeiro',
  'month-1': 'Fevereiro',
  'month-2': 'Março',
  'month-3': 'Abril',
  'month-4': 'Maio',
  'month-5': 'Junho',
  'month-6': 'Julho',
  'month-7': 'Agosto',
  'month-8': 'Setembro',
  'month-9': 'Outubro',
  'month-10': 'Novembro',
  'month-11': 'Dezembro',
  
  // Months (abbreviated)
  'month-short-0': 'Jan',
  'month-short-1': 'Fev',
  'month-short-2': 'Mar',
  'month-short-3': 'Abr',
  'month-short-4': 'Mai',
  'month-short-5': 'Jun',
  'month-short-6': 'Jul',
  'month-short-7': 'Ago',
  'month-short-8': 'Set',
  'month-short-9': 'Out',
  'month-short-10': 'Nov',
  'month-short-11': 'Dez',
  
  // Calendar
  today: 'Hoje',
  previous: 'Anterior',
  next: 'Próximo',
  selectMonthYear: 'Selecionar mês/ano',
  
  // Events
  events: 'Eventos',
  newEvent: 'Novo Evento',
  editEvent: 'Editar Evento',
  deleteEvent: 'Excluir evento',
  deleteEventConfirm: 'Tem certeza que deseja excluir este evento?',
  eventTitle: 'Título',
  eventTitlePlaceholder: 'Nome do evento',
  eventTitleRequired: 'O título é obrigatório',
  eventDescription: 'Descrição',
  eventDescriptionPlaceholder: 'Adicione detalhes sobre o evento...',
  eventTime: 'Horário',
  eventDuration: 'Duração (min)',
  eventAllDay: 'Evento de dia inteiro',
  eventCreated: 'Evento criado com sucesso!',
  eventUpdated: 'Evento atualizado com sucesso!',
  eventDeleted: 'Evento deletado com sucesso!',
  eventError: 'Erro ao salvar evento',
  clickToEdit: 'Clique para editar',
  
  // Tags
  tags: 'Tags',
  manageTags: 'Gerenciar Tags',
  newTag: 'Nova Tag',
  editTag: 'Editar Tag',
  deleteTag: 'Excluir tag',
  deleteTagConfirm: 'Tem certeza que deseja excluir esta tag?',
  tagName: 'Nome',
  tagNamePlaceholder: 'Ex: Trabalho, Pessoal, Família',
  tagNameRequired: 'O nome é obrigatório',
  tagColor: 'Cor',
  tagCreated: 'Tag criada com sucesso!',
  tagUpdated: 'Tag atualizada com sucesso!',
  tagDeleted: 'Tag deletada com sucesso!',
  tagError: 'Erro ao criar tag',
  noTags: 'Nenhuma tag criada ainda',
  createFirstTag: 'Crie sua primeira tag para começar',
  editingTag: 'Editando tag',
  createTag: 'Criar Tag',
  updateTag: 'Atualizar Tag',
  
  // Auth
  login: 'Entrar',
  signup: 'Cadastrar',
  logout: 'Sair',
  email: 'E-mail',
  password: 'Senha',
  emailPlaceholder: 'seu@email.com',
  passwordPlaceholder: '••••••••',
  authDescription: 'Faça login ou crie sua conta',
  error: 'Erro',
  success: 'Sucesso',
  fillAllFields: 'Preencha todos os campos',
  invalidCredentials: 'E-mail ou senha incorretos',
  loginSuccess: 'Login realizado com sucesso!',
  signupSuccess: 'Conta criada! Verifique seu e-mail para confirmar.',
  passwordTooShort: 'A senha deve ter pelo menos 6 caracteres',
  emailAlreadyRegistered: 'Este e-mail já está cadastrado',
  loading: 'Carregando...',
  
  // Family
  family: 'Família',
  familyName: 'Nome da família',
  familyNamePlaceholder: 'Ex: Família Silva',
  createFamily: 'Criar Família',
  familyCreated: 'Família criada com sucesso!',
  selectFamily: 'Selecionar família',
  familySettings: 'Configurações da Família',
  loginToAccessFamily: 'Faça login para acessar seu calendário familiar',
  welcomeFamily: 'Bem-vindo!',
  familySetupDescription: 'Crie uma nova família ou aceite um convite para começar.',
  
  // Settings
  settings: 'Configurações',
  language: 'Idioma',
  theme: 'Tema',
  
  // Languages
  portuguese: 'Português',
  english: 'English',
  
  // Themes
  themeDark: 'Escuro',
  themeLight: 'Claro',
};

export type TranslationKey = keyof typeof pt;
