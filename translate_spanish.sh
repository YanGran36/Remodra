#!/bin/bash

# A script to translate common Spanish phrases in the codebase to English

# Error and validation messages
find ./client/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/La descripción es requerida/Description is required/g'
find ./client/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/La cantidad es requerida/Quantity is required/g'
find ./client/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/La cantidad debe ser al menos 1/Quantity must be at least 1/g'
find ./client/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/El precio unitario es requerido/Unit price is required/g'
find ./client/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/El monto es requerido/Amount is required/g'
find ./client/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/El subtotal es requerido/Subtotal is required/g'
find ./client/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/El total es requerido/Total is required/g'
find ./client/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/El estado es requerido/Status is required/g'
find ./client/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/El número de orden de trabajo es requerido/Work order number is required/g'
find ./client/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/La fecha de emisión es requerida/Issue date is required/g'
find ./client/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/La fecha de vencimiento es requerida/Due date is required/g'

# Toast messages and notifications
find ./client/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/Error al agregar ítem/Error adding item/g'
find ./client/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/No se pueden agregar ítems/Cannot add items/g'
find ./client/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/Debe agregar al menos un ítem al estimado/You must add at least one item to the estimate/g'
find ./client/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/No se pudo cargar el estimado/Could not load the estimate/g'
find ./client/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/Error al actualizar la orden de trabajo/Error updating the work order/g'

# Comment translations
find ./client/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/\/\/ Limpiar el formulario para un nuevo ítem/\/\/ Clear the form for a new item/g'
find ./client/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/\/\/ Obtener porcentajes de impuesto y descuento del formulario/\/\/ Get tax and discount percentages from the form/g'
find ./client/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/\/\/ Recalcular el monto si cambia la cantidad o el precio unitario/\/\/ Recalculate the amount if quantity or unit price changes/g'
find ./client/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/\/\/ Asegurar que son números válidos/\/\/ Ensure they are valid numbers/g'
find ./client/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/\/\/ Recalcular totales/\/\/ Recalculate totals/g'
find ./client/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/\/\/ Recalcular subtotal, impuestos y total/\/\/ Recalculate subtotal, taxes and total/g'
find ./client/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/\/\/ Calcular el subtotal sumando los montos de todos los items/\/\/ Calculate subtotal by summing all item amounts/g'

# Form placeholders and labels
find ./client/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/<SelectValue placeholder="Seleccionar estimado" \/>/<SelectValue placeholder="Select estimate" \/>/g'
find ./client/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/<SelectItem value="no_estimate">Sin estimado<\/SelectItem>/<SelectItem value="no_estimate">No estimate<\/SelectItem>/g'
find ./client/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/Usar artículos del estimado/Use items from estimate/g'

# Console log messages
find ./client/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/console.log("Ítem agregado:/console.log("Item added:/g'
find ./client/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/console.log("Items actuales:/console.log("Current items:/g'

# Success messages
find ./client/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/El estimado \${[^}]*} ha sido actualizado exitosamente/Estimate \${[^}]*} has been successfully updated/g'
find ./client/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/El estimado \${[^}]*} ha sido creado exitosamente/Estimate \${[^}]*} has been successfully created/g'

# Loading states
find ./client/src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/<p className="[^"]*">Cargando datos del estimado...<\/p>/<p className="[^"]*">Loading estimate data...<\/p>/g'

echo "Translation completed successfully!"