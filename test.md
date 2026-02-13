<div style="margin-bottom: 120px;">
    <div style="float:left;">
        <br/>
        <img src="notebooks-img/udc.png" width="300"/>
    </div>
</div>


<h1 style="color: #d60e8c; text-align:center;">Semana 1: Entrada / Salida</h1> 


<h2>Contenidos</h2>
<div class="alert alert-block alert-info" 
     style="margin-top: 0px; padding-top:0px; border: 1px solid #d60e8c; border-radius: 20px; background:transparent;">
    <ul>
        <li><a href="#print">Escritura en pantalla</a></li>
        <li><a href="#input">Lectura de datos por teclado</a></li>
        <li><a href="#example">Ejemplo de programa</a></li>
    </ul>
</div>

<a name="print"></a>

<h2 style="color: #d60e8c;">Escritura por pantalla</h2>
<hr style="border: 0.5px solid #d60e8c;">


- Usa `print()` para escribir en pantalla.
- `print()` admite múltiples argumentos, por defecto los separa por un espacio en blanco y finaliza con un salto de línea.
- Las cadenas de caracteres (texto) pueden escribirse entre comillas dobles o simples.
- Una cadena con formato va precedida de **f**.
- Las cadenas de caracteres pueden unirse con el operador `+`.
- Un número puede convertirse a texto con la función `str()`.


<h3 style="color: #d60e8c;">Ejemplo 1</h3>

Asignamos valores a las variables n1 y n2


```python
n1 = 1
n2 = 2
```

Mostramos las variables `n1` y `n2` por pantalla de tres formas distinas con la función `print`:


```python
print("n1 vale", n1, "y n2 vale", n2)
```


```python
print(f"n1 vale {n1} y n2 vale {n2}")
```


```python
print("n1 vale " + str(n1) + " y n2 vale " + str(n2))
```

<h3 style="color: #d60e8c;">Ejemplo 2</h3>

Asignamos valores a las variables n3 y n4


```python
n3 = 8.9
n4 = 12.316
```

Mostramos las variables `n3` y `n4` por pantalla, indicando el número de decimales a mostrar:


```python
print(f"n3 vale {n3:.2f} y n4 vale {n4:.2f}")
```

<a name="input"></a>

<h2 style="color: #d60e8c;">Lectura de datos por teclado</h2>
<hr style="border: 0.5px solid #d60e8c;">

- Usa `input()` para leer datos por teclado:
    - Devuelve una cadena de caracteres.
    - Admite un argumento que es el texto que se desea que salga por pantalla para informar al usuario.
- Un cadena de caracteres puede convertirse a entero con la función int(), a número real con float(), etc.


<h3 style="color: #d60e8c;">Ejemplo 1</h3>

Pedimos por teclado un valor, lo convertimos a un entero y se lo asignamos a la variable `n1`:


```python
n1 = int(input("Dime el valor de n1: "))
```

Pedimos por teclado un valor, lo convertimos a un entero y se lo asignamos a la variable `n2`:


```python
n2 = int(input("Dime el valor de n2: "))
```

Mostramos las variables por pantalla:


```python
print("n1 vale", n1, "y n2 vale", n2)
```

Mostramos la suma de las variables por pantalla:


```python
print("n1 + n2 = ", n1+n2)
```

<h3 style="color: #d60e8c;">Ejemplo 2</h3>

Pedimos por teclado un valor y se lo asignamos a la variable `n3`:


```python
n3 = input("Dime el valor de n3: ")
```

Pedimos por teclado un valor y se lo asignamos a la variable `n4`:


```python
n4 = input("Dime el valor de n4: ")
```

Mostramos las variables por pantalla:


```python
print("n3 vale", n3, "y n4 vale", n4)
```

Mostramos la suma de las variables por pantalla:


```python
print("n3 + n4 = ", n3+n4)
```

<a name="example"></a>

<h2 style="color: #d60e8c;">Ejemplo de programa</h2>

<h3 style="color: #d60e8c;">Enunciado:</h3>

- Implementar un programa en Python que calcule:
  - Área de un círculo para un radio dado `(π*radio2)`
  - Longitud de la circunferencia con dicho radio `(2*π*radio)`
- El radio será pedido al usuario.
- Los resultados deben mostrarse por pantalla con 2 decimales.


<h3 style="color: #d60e8c;">Solución paso a paso:</h3>

1. Importamos librería math para usar la constante pi


```python
"""
Programa que calcula el área y longitud de una circunferencia.
"""
import math
```

2. Pedimos por teclado el valor del radio, lo convertimos a `float` y lo asignamos a la variable `radio`:


```python
radio = float(input("Introduce el radio: "))
```

3. Calculamos el valor del área escribiendo su fórmula como una expresión en Python.


```python
area = math.pi * radio ** 2
```

4. Calculamos el valor de la longitud escribiendo su fórmula como una expresión en Python.


```python
longitud = 2 * math.pi * radio
```

5. Mostramos por pantalla (con dos decimales) el área y la longitud.


```python
print(f"El area vale {area:.2f} y la longitud {longitud:.2f}")
```

<h3 style="color: #d60e8c;">Solución completa:</h3>


```python
"""
Programa que calcula el área y longitud de una circunferencia.
"""
import math

radio = float(input("Introduce el radio: "))

area = math.pi * radio **2
longitud = 2 * math.pi * radio

print(f"El area vale {area:.2f} y la longitud {longitud:.2f}")
```

<br/>
<hr style="border: 0.5px solid #d60e8c;">

<div style="float:left;">
INFORMÁTICA
</div>
<div style="text-align:right;">
Grados en Ing. Mecánica e Ing. en Tecnologías Industriales
</div>
