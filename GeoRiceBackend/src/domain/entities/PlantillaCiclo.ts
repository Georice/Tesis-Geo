export type TipoCiclo = 'siembra_boleo' | 'siembra_trasplante' | 'soca' | 'resoca';

export interface ActividadPlantilla {
  tipo: string;
  orden: number;
  diasDesdeInicio: number;  // día estimado desde inicio del ciclo
  descripcion: string;
  obligatoria: boolean;
}

export const PLANTILLAS_CICLO: Record<TipoCiclo, ActividadPlantilla[]> = {

  siembra_boleo: [
    { tipo: 'preparacion_suelo',   orden: 1,  diasDesdeInicio: 0,   descripcion: 'Preparación del suelo con rastra o maquinaria',     obligatoria: true  },
    { tipo: 'inundacion',          orden: 2,  diasDesdeInicio: 3,   descripcion: 'Inundación del terreno antes de la siembra',         obligatoria: true  },
    { tipo: 'siembra_boleo',       orden: 3,  diasDesdeInicio: 7,   descripcion: 'Siembra al voleo de la semilla de arroz',            obligatoria: true  },
    { tipo: 'riego',               orden: 4,  diasDesdeInicio: 15,  descripcion: 'Primer riego post siembra',                          obligatoria: true  },
    { tipo: 'fertilizacion',       orden: 5,  diasDesdeInicio: 20,  descripcion: 'Primera fertilización (arranque)',                   obligatoria: true  },
    { tipo: 'deshierba',           orden: 6,  diasDesdeInicio: 25,  descripcion: 'Control de malezas',                                 obligatoria: false },
    { tipo: 'fumigacion',          orden: 7,  diasDesdeInicio: 35,  descripcion: 'Primera fumigación preventiva',                      obligatoria: false },
    { tipo: 'fertilizacion',       orden: 8,  diasDesdeInicio: 45,  descripcion: 'Segunda fertilización (engrose)',                    obligatoria: true  },
    { tipo: 'fumigacion',          orden: 9,  diasDesdeInicio: 60,  descripcion: 'Segunda fumigación si hay plagas',                   obligatoria: false },
    { tipo: 'riego',               orden: 10, diasDesdeInicio: 70,  descripcion: 'Riego de llenado de grano',                         obligatoria: true  },
    { tipo: 'cosecha',             orden: 11, diasDesdeInicio: 110, descripcion: 'Cosecha del ciclo principal',                        obligatoria: true  },
  ],

  siembra_trasplante: [
    { tipo: 'preparacion_suelo',   orden: 1,  diasDesdeInicio: 0,   descripcion: 'Preparación del suelo',                             obligatoria: true  },
    { tipo: 'inundacion',          orden: 2,  diasDesdeInicio: 3,   descripcion: 'Inundación del terreno',                            obligatoria: true  },
    { tipo: 'siembra_trasplante',  orden: 3,  diasDesdeInicio: 25,  descripcion: 'Trasplante de plántulas al campo definitivo',        obligatoria: true  },
    { tipo: 'riego',               orden: 4,  diasDesdeInicio: 30,  descripcion: 'Primer riego post trasplante',                      obligatoria: true  },
    { tipo: 'fertilizacion',       orden: 5,  diasDesdeInicio: 35,  descripcion: 'Primera fertilización (arranque)',                   obligatoria: true  },
    { tipo: 'deshierba',           orden: 6,  diasDesdeInicio: 40,  descripcion: 'Control de malezas',                                obligatoria: false },
    { tipo: 'fumigacion',          orden: 7,  diasDesdeInicio: 50,  descripcion: 'Primera fumigación preventiva',                     obligatoria: false },
    { tipo: 'fertilizacion',       orden: 8,  diasDesdeInicio: 60,  descripcion: 'Segunda fertilización (engrose)',                   obligatoria: true  },
    { tipo: 'fumigacion',          orden: 9,  diasDesdeInicio: 75,  descripcion: 'Segunda fumigación si hay plagas',                  obligatoria: false },
    { tipo: 'riego',               orden: 10, diasDesdeInicio: 85,  descripcion: 'Riego de llenado de grano',                        obligatoria: true  },
    { tipo: 'cosecha',             orden: 11, diasDesdeInicio: 120, descripcion: 'Cosecha del ciclo principal',                       obligatoria: true  },
  ],

  soca: [
    { tipo: 'rozar_quemar',        orden: 1,  diasDesdeInicio: 0,   descripcion: 'Rozar y quemar el rastrojo del ciclo anterior',     obligatoria: true  },
    { tipo: 'soca_riego',          orden: 2,  diasDesdeInicio: 5,   descripcion: 'Primer riego del ciclo soca',                      obligatoria: true  },
    { tipo: 'soca_fertilizacion',  orden: 3,  diasDesdeInicio: 15,  descripcion: 'Fertilización del ciclo soca',                     obligatoria: true  },
    { tipo: 'soca_fumigacion',     orden: 4,  diasDesdeInicio: 25,  descripcion: 'Fumigación preventiva soca',                       obligatoria: false },
    { tipo: 'soca_riego',          orden: 5,  diasDesdeInicio: 35,  descripcion: 'Segundo riego soca',                               obligatoria: true  },
    { tipo: 'soca_fumigacion',     orden: 6,  diasDesdeInicio: 50,  descripcion: 'Segunda fumigación si hay plagas',                  obligatoria: false },
    { tipo: 'cosecha_soca',        orden: 7,  diasDesdeInicio: 75,  descripcion: 'Cosecha del ciclo soca',                           obligatoria: true  },
  ],

  resoca: [
    { tipo: 'rozar_quemar',        orden: 1,  diasDesdeInicio: 0,   descripcion: 'Rozar y quemar el rastrojo',                       obligatoria: true  },
    { tipo: 'soca_riego',          orden: 2,  diasDesdeInicio: 5,   descripcion: 'Primer riego resoca',                              obligatoria: true  },
    { tipo: 'soca_fertilizacion',  orden: 3,  diasDesdeInicio: 15,  descripcion: 'Fertilización resoca',                             obligatoria: true  },
    { tipo: 'soca_riego',          orden: 4,  diasDesdeInicio: 30,  descripcion: 'Segundo riego resoca',                             obligatoria: true  },
    { tipo: 'cosecha_soca',        orden: 5,  diasDesdeInicio: 65,  descripcion: 'Cosecha resoca',                                   obligatoria: true  },
  ],
};