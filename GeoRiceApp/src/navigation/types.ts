export type RootStackParamList = {
  Login:          undefined;
  RecuperarPassword: undefined;
  Registro:       undefined;
  Dashboard:      { accion?: string; zona?: any; parcela?: any; capa?: any; ts?: number } | undefined;
  Zonas:          undefined;
  Actividades:    { parcela: any };
  Capas:          { parcela: any };
  IniciarCiclo:   { parcela: any };
  AdminUsuarios:  undefined;
  Reportes:       undefined;
};