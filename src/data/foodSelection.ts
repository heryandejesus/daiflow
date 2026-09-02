export type FoodCategoryId =
  | 'vegetales-a'
  | 'vegetales-b'
  | 'vegetales-c'
  | 'frutas'
  | 'legumbres'
  | 'lacteos'
  | 'huevos'
  | 'carnes'
  | 'frutos-secos'
  | 'semillas'
  | 'cuerpos-grasos'
  | 'cereales-pseudocereales'

export interface FoodSelectionCategory {
  readonly id: FoodCategoryId
  readonly title: string
  readonly items: readonly string[]
}

export const foodSelection: readonly FoodSelectionCategory[] = [
  {
    id: 'vegetales-a',
    title: 'Vegetales A',
    items: [
      'Acelga',
      'Acusai',
      'Achicoria',
      'Ají',
      'Apio',
      'Berenjena',
      'Berro',
      'Brócoli',
      'Brotes de alfalfa',
      'Brotes de soja',
      'Cardo',
      'Coliflor',
      'Champiñon',
      'Escarola',
      'Espárrago',
      'Espinaca',
      'Hinojo',
      'Kale',
      'Lechuga',
      'Nabiza',
      'Rabanito',
      'Radicheta',
      'Repollo blanco',
      'Repollo morado',
      'Rúcula',
      'Tomate',
      'Tomate cherry',
      'Zapallito',
      'Zucchini',
    ],
  },
  {
    id: 'vegetales-b',
    title: 'Vegetales B',
    items: [
      'Alcaucil',
      'Arvejas frescas',
      'Cabutia',
      'Calabaza',
      'Cebolla blanca',
      'Cebolla morada',
      'Cebolla de verdeo',
      'Ciboulette',
      'Chauchas',
      'Habas',
      'Nabo',
      'Puerro',
      'Remolacha',
      'Repollitos de Bruselas',
      'Zanahoria',
      'Zapallo',
    ],
  },
  {
    id: 'vegetales-c',
    title: 'Vegetales C',
    items: ['Batata', 'Choclo', 'Mandioca', 'Papa'],
  },
  {
    id: 'frutas',
    title: 'Frutas',
    items: [
      'Ananá',
      'Arándanos',
      'Banana',
      'Cereza',
      'Ciruela',
      'Damasco',
      'Durazno',
      'Frambuesa',
      'Frutilla',
      'Higo',
      'Kiwi',
      'Limón',
      'Mandarina',
      'Mango',
      'Manzana',
      'Melón',
      'Moras',
      'Naranja',
      'Palta',
      'Papaya',
      'Pera',
      'Pomelo',
      'Sandía',
      'Uva',
    ],
  },
  {
    id: 'legumbres',
    title: 'Legumbres',
    items: [
      'Arvejas secas',
      'Garbanzos',
      'Habas',
      'Lentejas',
      'Porotos',
      'Soja',
    ],
  },
  {
    id: 'lacteos',
    title: 'Lácteos',
    items: ['Leche 0%', 'Queso descremado', 'Ricota magra', 'Yogur sin azúcar'],
  },
  {
    id: 'huevos',
    title: 'Huevos',
    items: ['Entero', 'Claras'],
  },
  {
    id: 'carnes',
    title: 'Carnes',
    items: [
      'Bife de lomo',
      'Ojo de bife',
      'Cuadril',
      'Lomo',
      'Nalga',
      'Peceto',
      'Pollo de granja',
      'Carré de cerdo',
      'Lomo de cerdo',
      'Pescado',
      'Mariscos',
    ],
  },
  {
    id: 'frutos-secos',
    title: 'Frutos secos',
    items: ['Almendra', 'Avellana', 'Castañas', 'Nueces', 'Maní', 'Pistacho'],
  },
  {
    id: 'semillas',
    title: 'Semillas',
    items: [
      'Amapola',
      'Calabaza',
      'Chía',
      'Girasol',
      'Lino',
      'Sésamo',
      'Sésamo negro',
    ],
  },
  {
    id: 'cuerpos-grasos',
    title: 'Cuerpos grasos',
    items: [
      'Aceite de canola',
      'Aceite de chía',
      'Aceite de girasol',
      'Aceite de lino',
      'Aceite de maíz',
      'Aceite de oliva',
      'Aceite de soja',
      'Aceite de uva',
    ],
  },
  {
    id: 'cereales-pseudocereales',
    title: 'Cereales y pseudocereales',
    items: [
      'Amaranto',
      'Arroz integral',
      'Arroz yamaní',
      'Avena',
      'Cebada',
      'Centeno',
      'Quínoa',
      'Mijo',
      'Trigo burgol',
      'Trigo sarraceno',
      'Pastas integrales',
      'Harina integral',
    ],
  },
]
