Quiero que actúes simultáneamente como:

- Arquitecto de software senior.
- Ingeniero financiero.
- Economista especializado en finanzas personales.
- Desarrollador senior React + TypeScript + Node.js.
- Especialista en modelado de deuda de tarjetas de crédito.

Necesito construir una aplicación local, ligera y privada para ayudar a una persona a salir progresivamente de sus deudas de tarjetas de crédito.

La aplicación NO debe limitarse a registrar gastos.

Su objetivo principal debe ser responder preguntas como:

- ¿Cuánto debo realmente?
- ¿Cuánto de mi deuda corresponde a capital?
- ¿Cuánto estoy pagando en intereses?
- ¿Cuánto estoy pagando en cargos financieros?
- ¿Cuánto estoy amortizando realmente cada mes?
- Si pago solamente el mínimo, ¿cuánto tiempo tardaría en salir?
- Si pago $10, $20, $50 o $100 adicionales al mínimo, ¿cuánto tiempo e intereses ahorro?
- Si no puedo pagar el pago total pero pago un poco más que el mínimo, ¿cómo cambia mi deuda?
- Si difiero una nueva compra, ¿cómo afecta a mi deuda futura?
- Si actualmente estoy pagando solamente el mínimo y difiero $300 a 6, 12 o 18 meses, ¿cuánto más terminaré pagando?
- ¿Cuánto dinero de mi próximo pago irá a intereses y cuánto a capital?
- ¿Cuándo terminaré de pagar los diferidos actuales?
- ¿Cuál es mi verdadera capacidad de pago mensual?
- ¿Estoy mejorando o empeorando respecto al mes anterior?

# 1. Objetivo financiero

El principio principal del sistema será:

> El usuario no necesariamente puede pagar el total de la tarjeta, pero debe conocer exactamente el efecto de pagar una cantidad superior al mínimo.

La aplicación debe ayudar al usuario a tomar decisiones realistas.

NO utilizar mensajes del tipo:

"Simplemente pague toda la tarjeta".

Debe trabajar con escenarios reales de liquidez limitada.

Ejemplo:

Pago mínimo: $130
Usuario disponible: $180

El sistema debe poder decir:

Pago mínimo: $130
Pago adicional: $50
Pago total: $180

De ese pago estimamos:

Intereses: $32
Cargos financieros: $4
Amortización de capital: $144

Y comparar:

Pago mínimo:
- tiempo estimado: X meses
- intereses futuros: $X

Pago mínimo + $50:
- tiempo estimado: Y meses
- intereses futuros: $Y
- ahorro en intereses: $Z
- meses ahorrados: N

El objetivo principal es visualizar que incluso pequeñas cantidades adicionales pueden modificar significativamente la trayectoria de la deuda.

# 2. Stack tecnológico

Construir como aplicación desktop local.

Frontend:

- React
- TypeScript
- Vite
- React Router
- Zustand o Redux Toolkit solamente si realmente se necesita estado global.
- Recharts para gráficos.
- TanStack Table para tablas.
- React Hook Form + Zod para formularios y validaciones.
- Decimal.js para todos los cálculos monetarios.

Backend local:

- Electron
- Node.js
- TypeScript
- Sequelize
- SQLite

Importación:

- xlsx / SheetJS

La aplicación debe funcionar localmente y no requerir Internet.

La información financiera no debe salir del equipo del usuario.

Nunca utilizar `number` de JavaScript para cálculos financieros críticos sin normalización.

Utilizar Decimal.js.

# 3. Arquitectura

Separar claramente:

/src
  /renderer
  /main
  /shared
  /domain

Renderer:
React.

Main:
Electron + servicios SQLite.

Shared:
tipos, DTO, esquemas Zod.

Domain:
motor financiero completamente separado de React, Sequelize y Electron.

Ejemplo:

domain/
  debt/
  credit-card/
  interest/
  installments/
  simulations/
  payments/

El motor financiero debe poder probarse independientemente mediante tests unitarios.

Arquitectura aproximada:

React
    ↓ IPC
Electron Main
    ↓
Services
    ↓
Repositories
    ↓
Sequelize
    ↓
SQLite

El componente React jamás debe ejecutar SQL directamente.

# 4. Base de datos

Diseñar inicialmente estas entidades.

## CreditCard

id
name
issuer
maskedNumber
creditLimit
currency
annualInterestRate
monthlyInterestRate
minimumPaymentRule
cutoffDay
paymentDueDay
createdAt
updatedAt

## Statement

id
creditCardId
statementDate
periodStart
periodEnd
previousBalance
currentBalance
deferredBalance
totalDebt
minimumPayment
totalPaymentDue
availableCredit
creditLimit
interestCharged
feesCharged
insuranceCharged
taxesCharged
paymentsReceived
newPurchases
cashAdvances
createdAt

## Transaction

id
statementId
creditCardId
date
description
originalDescription
amount
type
category
installmentId
currency
source
createdAt

Tipos posibles:

PURCHASE
PAYMENT
INTEREST
FEE
TAX
CASH_ADVANCE
INSURANCE
INSTALLMENT
REFUND
ADJUSTMENT
OTHER

## InstallmentPlan

id
creditCardId
description
originalAmount
principalRemaining
interestRate
numberOfInstallments
installmentsPaid
installmentsRemaining
installmentAmount
startDate
endDate
totalFinancingCost
sourceTransactionId
createdAt

## Payment

id
creditCardId
date
amount
statementId
source
createdAt

## ImportBatch

id
filename
fileHash
importDate
issuer
statementPeriod
status
rowsRead
rowsImported
duplicatesIgnored

Esto es fundamental para evitar importar dos veces el mismo estado de cuenta.

# 5. Importación de Excel

El usuario debe poder:

1. Arrastrar uno o varios archivos `.xlsx`.
2. Seleccionarlos desde el explorador.
3. Previsualizar la información.
4. Confirmar antes de importar.

No asumir que los Excel siempre tienen el mismo formato.

Crear arquitectura basada en adaptadores:

StatementImporter

Implementaciones:

GenericExcelImporter
BancoPichinchaImporter
BancoGuayaquilImporter
ProdubancoImporter
PacificoImporter
etc.

No implementar todos inicialmente.

Primero implementar:

GenericExcelImporter

y un adaptador específico basado en los estados de cuenta reales suministrados durante el desarrollo.

El importador debe identificar:

- fecha de corte
- fecha máxima de pago
- saldo anterior
- saldo corriente
- saldo diferido
- deuda total
- pago mínimo
- pago total
- cupo
- cupo disponible
- pagos
- compras
- avances
- intereses
- tarifas
- seguros
- impuestos
- diferidos
- descripción de transacciones
- fechas de transacciones
- montos

Antes de guardar mostrar:

"Detectamos lo siguiente"

Fecha corte: XX
Saldo actual: XX
Saldo diferido: XX
Pago mínimo: XX
Pago total: XX
Intereses: XX
Compras: XX
Pagos: XX

[X] Confirmar importación

Si una columna no puede identificarse con suficiente certeza, solicitar mapeo manual.

El usuario podrá indicar:

Esta columna = fecha
Esta columna = descripción
Esta columna = monto

Guardar dicho esquema para futuras importaciones del mismo banco.

# 6. Normalización

Nunca depender directamente del nombre textual utilizado por el banco.

Ejemplo:

"INTERES FINANCIAMIENTO"
"INTERÉS DE FINANCIAMIENTO"
"INT. FINANC."
"INTERES"

Todos deben poder normalizarse a:

INTEREST

Crear reglas configurables.

Lo mismo para:

AVANCE
CASH ADVANCE
AVANCE VENTANILLA

→ CASH_ADVANCE

# 7. Motor financiero

Esta es la parte más importante del sistema.

Debe existir un módulo:

DebtSimulationEngine

Entrada:

principal
annualInterestRate
monthlyInterestRate
minimumPayment
minimumPaymentPercentage
fixedPayment
extraPayment
newMonthlyPurchases
installmentPlans
fees
simulationMonths

Salida:

month
startingBalance
newPurchases
interest
fees
minimumPayment
extraPayment
actualPayment
principalPaid
endingBalance

Utilizar cálculos con Decimal.js.

# 8. Diferenciar datos reales y estimaciones

MUY IMPORTANTE.

La aplicación debe diferenciar:

REAL

y

ESTIMADO.

Si el Excel dice:

INTERÉS FINANCIAMIENTO = $14.46

ese valor debe mostrarse como:

Interés real cobrado por el banco: $14.46

No recalcularlo ni reemplazarlo.

Para simulaciones futuras utilizar:

Interés estimado.

Mostrar claramente:

"Proyección basada en una tasa mensual de X%."

Nunca presentar una simulación como si fuera un valor exacto del banco.

# 9. Cálculo de tasa

Permitir registrar:

Tasa anual nominal.
Tasa efectiva anual.
Tasa mensual.

No confundirlas.

Si solamente tenemos una tasa efectiva anual:

monthlyRate =
(1 + annualEffectiveRate)^(1/12) - 1

Si tenemos una tasa nominal anual dividida mensualmente:

monthlyRate =
annualNominalRate / 12

Guardar qué metodología se está utilizando.

# 10. Simulación pagando mínimo

Crear:

simulateMinimumPayment()

Ejemplo conceptual:

balance = deuda

para cada mes:

interest = balance * monthlyRate

balanceWithInterest =
balance + interest + fees + newPurchases

payment =
calculateMinimumPayment(balanceWithInterest)

principalPayment =
payment - interest - fees

endingBalance =
balanceWithInterest - payment

continuar hasta:

balance <= 0

o alcanzar:

600 meses

Debe existir protección contra escenarios donde:

payment <= interest + fees

En ese caso indicar:

ALERTA:
"El pago realizado prácticamente no está reduciendo capital."

# 11. Pago superior al mínimo

Esta será una función central.

simulateMinimumPlusExtra(extraAmount)

Ejemplo:

minimum = 130
extra = 50

payment = 180

Mostrar comparación.

ESCENARIO A
Pago mínimo

ESCENARIO B
Pago mínimo + $50

Resultados:

Meses para salir:
A = 31
B = 21

Intereses futuros:
A = $X
B = $Y

Ahorro:
$Z

Tiempo ahorrado:
10 meses

El usuario debe poder mover un slider:

+$0
+$10
+$20
+$30
+$50
+$75
+$100
+$150
+$200

y observar instantáneamente cómo cambia la deuda.

# 12. Simulador "Tengo $X"

Crear una herramienta extremadamente sencilla:

"Este mes puedo pagar: $_____"

Ejemplo:

Pago mínimo:
$136

El usuario escribe:

$190

El sistema calcula:

Pago mínimo: $136
Pago adicional: $54

Estimación:

Interés del período: $XX
Cargos: $XX
Capital amortizado: $XX

Nuevo saldo estimado:
$XXXX

Y:

"Este pago adicional podría ahorrarte aproximadamente $XX de intereses futuros y X meses."

# 13. Simulador de nueva compra

Crear:

"¿Qué pasa si compro esto?"

Monto:
$300

Opciones:

Corriente
3 meses
6 meses
9 meses
12 meses
18 meses
24 meses

Tasa:
X%

Calcular:

cuota
capital
intereses
costo financiero
costo final

Ejemplo:

Compra:
$300

Diferida 12 meses:

Capital:
$300

Intereses:
$52

Costo final:
$352

Cuota:
$29.33

Pero además debe calcular el efecto sobre TODA la deuda actual.

Ejemplo:

Situación actual:

Deuda:
$2,500

Pagando mínimo:

Tiempo para salir:
28 meses

Intereses proyectados:
$420

Si añade nuevo diferido de $300:

Nueva deuda:
$2,800

Tiempo:
34 meses

Intereses:
$530

Impacto de la decisión:

+$300 capital
+$110 costo financiero proyectado acumulado
+6 meses de deuda

Esta comparación es más importante que simplemente mostrar la cuota.

# 14. Caso crítico: diferir mientras pago mínimos

Crear una herramienta específica:

"Estoy pagando el mínimo. ¿Qué pasa si difiero $X?"

Entrada:

deuda actual
pago mínimo
tasa
monto nuevo
plazo diferido
tasa del diferido

Resultado:

SIN NUEVA COMPRA

Deuda actual
Meses restantes
Interés futuro

CON NUEVO DIFERIDO

Nueva deuda
Nueva obligación mensual
Meses restantes
Interés futuro

IMPACTO

Capital adicional
Interés adicional
Costo total adicional
Meses adicionales endeudado

Esta funcionalidad es obligatoria.

# 15. Diferidos

Tratar los diferidos separadamente de la deuda rotativa.

Mostrar:

Capital original
Capital pendiente
Cuotas pagadas
Cuotas restantes
Cuota mensual
Intereses
Fecha esperada de finalización

Ejemplo:

Laptop
Original: $600
12 cuotas
Cuota: $55
Pagadas: 7
Restantes: 5
Saldo estimado: $275

No sumar incorrectamente:

saldo diferido + suma original de compras.

Evitar doble contabilización.

# 16. Dashboard

El Dashboard principal debe responder en menos de 10 segundos visuales:

¿Debo más o menos que el mes pasado?

Mostrar cards:

DEUDA TOTAL

$2,549

CAMBIO MENSUAL

+$131
↑ 5.4%

PAGO MÍNIMO

$XXX

INTERÉS ÚLTIMO MES

$XX

CAPITAL REDUCIDO

$XX

USO DE CUPO

80%

DIFERIDO PENDIENTE

$865

También mostrar:

"De cada $100 pagados este mes:"

$XX → capital
$XX → intereses
$XX → tarifas/impuestos

# 17. Gráfico principal

Crear gráfico:

Evolución de deuda.

Eje X:
mes.

Eje Y:
saldo.

Líneas:

Deuda real histórica
Proyección pagando mínimo
Proyección mínimo + pago extra

Esto permitirá visualizar algo como:

mínimo:
──────────────╲___

mínimo + $50:
────────╲____

# 18. Evolución mensual

Mostrar tabla:

Mes
Saldo anterior
Compras
Diferidos
Intereses
Tarifas
Pagos
Reducción capital
Saldo final

Permitir expandir cada mes y mostrar las transacciones.

# 19. Detector de deuda peligrosa

Crear reglas financieras.

Ejemplos:

Uso de cupo > 80%

Nivel:
ALTO

Uso > 90%

Nivel:
CRÍTICO

Pago adicional = 0 durante varios meses

Advertencia.

Intereses creciendo durante 3 meses consecutivos

Advertencia:

"Los costos financieros están aumentando."

Nueva deuda > capital amortizado

Advertencia:

"Estás generando deuda más rápido de lo que la estás pagando."

Esta métrica es importantísima:

debtVelocity =
newDebt - principalPaid

Si:

debtVelocity > 0

la deuda está creciendo.

Si:

debtVelocity < 0

la deuda está bajando.

# 20. Velocidad de salida

Crear indicador:

Debt Reduction Rate

Ejemplo:

Mes anterior:
$2,700

Actual:
$2,550

Reducción:
$150

Debt reduction rate:
5.56%

Mostrar:

"Redujiste tu deuda $150 este mes."

o:

"Tu deuda aumentó $130 este mes."

# 21. Pago inteligente

El usuario indicará:

Ingreso mensual:
$X

Gastos esenciales:
$X

Otros compromisos:
$X

Reserva mínima:
$X

Calcular:

availableForDebt =
income
- essentialExpenses
- commitments
- minimumReserve

No recomendar utilizar el 100% del dinero disponible.

Permitir configurar:

margen de seguridad.

Por ejemplo:

10%

Entonces:

safeDebtPayment =
availableForDebt * 0.90

Comparar contra:

minimumPayment.

# 22. Objetivos

Permitir crear:

"Quiero bajar la tarjeta a $2,000"

"Quiero bajar utilización al 60%"

"Quiero salir en 18 meses"

Calcular cuánto debería pagar aproximadamente cada mes.

Ejemplo:

Objetivo:

Salir en 18 meses.

Pago estimado requerido:

$188/mes

Actualmente:

$145

Diferencia:

+$43

El mensaje debe ser:

"Necesitas aproximadamente $43 adicionales al mes."

No:

"No puedes alcanzar tu objetivo."

# 23. Utilización de tarjeta

Calcular:

utilization =
totalDebt / creditLimit * 100

Indicadores:

0–30%
Bajo

30–50%
Moderado

50–80%
Alto

80–90%
Muy alto

90–100%
Crítico

Esto no debe utilizarse como puntaje crediticio.

Simplemente como indicador de presión financiera.

# 24. Transacciones recurrentes

Detectar automáticamente cargos similares:

AWS
Cursor
hosting
Netflix
Spotify
seguros
suscripciones

Agrupar usando descripción normalizada.

Mostrar:

Gastos recurrentes detectados:

AWS: $XX/mes
Cursor: $XX/mes
Hosting: $XX/mes

Total recurrente:
$XX/mes

Permitir clasificarlos:

Esencial
Trabajo
Negocio
Personal
Prescindible

NO decidir automáticamente que un gasto es innecesario.

# 25. Separación personal / negocio

Cada transacción tendrá:

purpose:

PERSONAL
BUSINESS
SHARED
UNKNOWN

Esto permitirá saber cuánto de la tarjeta corresponde realmente a negocio.

Mostrar:

Deuda asociada a gastos personales:
$X

Deuda asociada a negocio:
$Y

Sin afirmar que el saldo financiero puede dividirse exactamente si existen intereses generales.

# 26. Historial

Nunca sobrescribir estados anteriores.

Cada importación crea un Statement histórico.

Debe permitir reconstruir:

noviembre
diciembre
enero
febrero
...

El usuario debe poder ver la evolución completa.

# 27. Duplicados

Crear huella:

fileHash

y también:

transactionFingerprint =
date + normalizedDescription + amount + cardId

Advertir antes de importar posibles duplicados.

No eliminarlos automáticamente si existe posibilidad de que sean transacciones reales repetidas.

# 28. Configuración bancaria

Cada tarjeta tendrá:

tasa anual
tasa mensual
método de mínimo
porcentaje mínimo
mínimo fijo
fecha corte
fecha pago
cargos conocidos

El cálculo del mínimo debe ser configurable porque cada emisor puede utilizar reglas diferentes.

NO hardcodear una fórmula universal.

# 29. Precisión financiera

Todas las operaciones:

Decimal.js

Dinero:

2 decimales para presentación.

Mantener mayor precisión internamente.

No usar:

parseFloat(...).toFixed(...)

para lógica financiera.

toFixed solamente para representación visual.

# 30. Tests

Crear tests unitarios obligatorios para:

interest calculation
minimum payment
extra payment
compound simulation
installments
new purchase simulation
zero interest
negative balance
payment greater than balance
minimum lower than accrued interest
long simulations
rounding

Ejemplo crítico:

saldo = 1000
tasa mensual = 2%
pago = 100

interés = 20

capital amortizado = 80

saldo aproximado:

920

antes de considerar otras compras/cargos.

# 31. Diseño UI

No quiero una interfaz bancaria complicada.

Quiero una aplicación sencilla y orientada a decisiones.

Menú:

Dashboard

Mis tarjetas

Estados de cuenta

Movimientos

Diferidos

Simulador

Plan de salida

Configuración

Dashboard debe ser la pantalla principal.

El usuario debe poder entender su situación sin conocimientos financieros.

# 32. UX de simulación

La pantalla más importante será:

PLAN DE SALIDA

Debe mostrar:

Deuda actual

$2,549

Pago mínimo

$XXX

¿Cuánto puedes pagar?

[$____________]

Luego:

Pago adicional:
+$XX

Y comparar visualmente:

SOLO MÍNIMO

X meses
$XXX intereses

TU PAGO

Y meses
$YYY intereses

AHORRAS

$ZZZ
N meses

# 33. No culpabilizar

La aplicación debe ser neutral.

Evitar:

"Estás gastando demasiado."

Utilizar:

"Durante este período ingresaron $X en nuevos cargos mientras se amortizaron $Y de capital."

Dejar que los números expliquen la situación.

# 34. Privacidad

Por defecto:

100% local.

No telemetría.

No subir Excel a servidores.

No enviar información financiera a APIs.

Base:

SQLite local.

Permitir posteriormente:

backup cifrado.

Pero no implementarlo en MVP.

# 35. MVP

No intentar construir todo simultáneamente.

FASE 1

Base Electron + React + SQLite + Sequelize.

Implementar:

CreditCard
Statement
Transaction
Payment
ImportBatch

FASE 2

Importación XLSX.

Previsualización.

Normalización.

Persistencia.

FASE 3

Dashboard histórico.

FASE 4

DebtSimulationEngine.

FASE 5

Simulador:

mínimo vs mínimo + extra.

FASE 6

Diferidos.

FASE 7

Simulación de nueva compra.

FASE 8

Objetivos y plan de salida.

# 36. Primer desarrollo solicitado

Antes de escribir código quiero que analices toda esta especificación.

Entrégame primero:

1. Arquitectura propuesta.
2. Diagrama de módulos.
3. Modelo de dominio.
4. Modelo Sequelize.
5. Relaciones entre tablas.
6. Flujo de importación XLSX.
7. Diseño del DebtSimulationEngine.
8. Fórmulas financieras utilizadas.
9. Estructura de directorios.
10. Roadmap del MVP.

Después construiremos módulo por módulo.

No generes todo el proyecto de golpe.

Quiero arquitectura modular, mantenible, testeable y preparada para incorporar posteriormente otros bancos y otras tarjetas.

Prioridad absoluta:

CORRECTITUD FINANCIERA > INTERFAZ > VELOCIDAD DE DESARROLLO.

Cada cálculo debe poder explicar:

- de dónde salió el valor,
- qué fórmula se utilizó,
- qué valores son reales,
- qué valores son estimaciones.