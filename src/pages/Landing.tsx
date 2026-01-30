import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Users, Activity, Shield, Clock, Phone, Mail, MapPin, Star, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useDarkMode } from '../hooks/useDarkMode';

export const Landing: React.FC = () => {
  const features = [
    {
      icon: Heart,
      title: 'Cuidado con Amor',
      description: 'Nuestro equipo brinda atención cálida y personalizada, tratando a cada residente como parte de nuestra propia familia.'
    },
    {
      icon: Activity,
      title: 'Salud y Bienestar',
      description: 'Monitoreo médico constante, terapias físicas y programas de nutrición adaptados a las necesidades de cada adulto mayor.'
    },
    {
      icon: Users,
      title: 'Comunidad Activa',
      description: 'Fomentamos la socialización a través de actividades recreativas, culturales y talleres que mantienen la mente y el cuerpo activos.'
    }
  ];

  const benefits = [
    'Atención médica y de enfermería 24/7',
    'Planes de alimentación nutricional personalizados',
    'Terapias físicas y cognitivas',
    'Actividades recreativas y sociales diarias',
    'Habitaciones cómodas y seguras',
    'Servicio de lavandería y limpieza'
  ];

  const faqs = [
    {
      question: '¿Qué tipos de cuidados ofrecen?',
      answer: 'Ofrecemos cuidado asistido, cuidados de enfermería, y atención especializada para condiciones como Alzheimer y demencia, adaptándonos al nivel de independencia de cada residente.'
    },
    {
      question: '¿Cuáles son los horarios de visita?',
      answer: 'Fomentamos la cercanía familiar, por lo que tenemos horarios de visita abiertos y flexibles, siempre respetando los tiempos de descanso y actividades de los residentes.'
    },
    {
      question: '¿Tienen personal médico disponible?',
      answer: 'Sí, contamos con personal de enfermería las 24 horas del día y visitas médicas regulares para asegurar la salud integral de nuestros residentes.'
    }
  ];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [dark, setDark] = useDarkMode();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-700">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md shadow-sm border-b border-sky-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-2">
              <div className="bg-sky-100 p-2 rounded-full">
                <Heart className="h-6 w-6 text-sky-500" />
              </div>
              <span className="text-2xl font-bold text-slate-800 tracking-tight">GeriApp</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-slate-600 hover:text-sky-500 transition-colors font-medium"
              >
                Iniciar Sesión
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 bg-gradient-to-b from-sky-50 via-white to-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-block px-4 py-1.5 bg-sky-100 text-sky-700 rounded-full text-sm font-semibold mb-8 border border-sky-200 shadow-sm">
              Bienvenidos a su nuevo hogar
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-slate-800 mb-6 leading-tight tracking-tight">
              GeriApp <br />
              <span className="text-sky-500">Cuidado y Amor</span>
            </h1>
            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Dedicados a brindar la mejor calidad de vida a nuestros adultos mayores en un ambiente seguro, cómodo y familiar.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="https://casitademaria.com" target="_blank" rel="noopener noreferrer">
                <Button variant="primary" size="lg" className="bg-sky-500 text-white border-transparent hover:bg-sky-600 px-8 py-3 text-lg shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 rounded-full">
                  Agendar Visita
                </Button>
              </a>
              <a href="https://casitademaria.com" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="lg" className="border-2 border-sky-200 text-sky-600 hover:bg-sky-50 hover:border-sky-300 px-8 py-3 text-lg font-semibold rounded-full bg-white">
                  Nuestros Servicios
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-sky-100 rounded-full blur-3xl opacity-40 mix-blend-multiply"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-teal-100 rounded-full blur-3xl opacity-40 mix-blend-multiply"></div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">
              ¿Por qué elegirnos?
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Excelencia en el cuidado geriátrico con un enfoque humano y profesional.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-8 rounded-3xl border border-slate-100 hover:border-sky-200 shadow-sm hover:shadow-xl transition-all duration-300 bg-white group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white to-sky-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-sky-500 transition-colors duration-300 rotate-3 group-hover:rotate-0 transform">
                    <feature.icon className="w-8 h-8 text-sky-600 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About/Mission Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-block px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-semibold mb-4">Nuestra Filosofía</div>
              <h2 className="text-4xl font-bold text-slate-800 mb-6 leading-tight">
                Un Hogar Lleno de Vida
              </h2>
              <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                En GeriApp, creamos un ambiente donde nuestros residentes no solo son cuidados, sino que prosperan. Valoramos su independencia, dignidad y felicidad.
              </p>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Cada espacio ha sido diseñado pensando en la seguridad y comodidad, permitiendo que cada día sea una nueva oportunidad para disfrutar.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                  <div className="bg-blue-100 p-2 rounded-lg mr-4">
                    <Shield className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">Seguridad Total</h4>
                    <p className="text-sm text-slate-500">Monitoreo 24/7</p>
                  </div>
                </div>
                <div className="flex items-center p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                  <div className="bg-teal-100 p-2 rounded-lg mr-4">
                    <Clock className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">Atención Continua</h4>
                    <p className="text-sm text-slate-500">Personal calificado</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-tr from-sky-200 to-teal-50 rounded-3xl h-96 w-full flex items-center justify-center shadow-2xl overflow-hidden relative border-8 border-white">
                <Heart className="w-32 h-32 text-white/80 mx-auto mb-4 drop-shadow-lg" />
                <div className="absolute bottom-0 w-full p-6 bg-white/10 backdrop-blur-sm text-center">
                  <span className="text-white font-bold text-lg tracking-wide">Compromiso de Corazón</span>
                </div>
              </div>

              {/* Floating card */}
              <div className="absolute -bottom-8 -right-8 bg-white p-6 rounded-2xl shadow-xl border border-sky-100 max-w-xs hidden md:block transform rotate-2 hover:rotate-0 transition-transform duration-300">
                <div className="flex items-center mb-2">
                  <div className="flex text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-4 h-4 fill-current" />)}
                  </div>
                </div>
                <p className="text-slate-700 italic text-sm mb-3">"Gracias a GeriApp, mi madre ha vuelto a sonreír. El personal es increíble."</p>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-sky-200 rounded-full flex items-center justify-center text-sky-700 font-bold text-xs mr-2">MA</div>
                  <p className="text-slate-900 font-bold text-xs">María Álvarez</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services/Benefits List */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">
              Servicios Premium
            </h2>
            <p className="text-lg text-slate-600">
              Todo lo necesario para el máximo bienestar de nuestros residentes.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start p-6 bg-slate-50 rounded-2xl hover:bg-sky-50 transition-colors duration-300 border border-slate-100 hover:border-sky-200 group">
                <CheckCircle className="w-6 h-6 text-sky-500 mr-4 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <span className="text-slate-700 font-medium text-lg">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-sky-50/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-800 mb-4">
              Preguntas Frecuentes
            </h2>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all hover:border-sky-200">
                <h3 className="text-xl font-bold text-slate-800 mb-3">{faq.question}</h3>
                <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-sky-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">
            ¿Listo para conocer nuestras instalaciones?
          </h2>
          <p className="text-xl text-sky-50 mb-10 max-w-2xl mx-auto">
            Agende una visita hoy mismo y descubra por qué somos la mejor opción para el cuidado de sus seres queridos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="https://wa.me/529981519578" target="_blank" rel="noopener noreferrer">
              <Button variant="primary" size="lg" className="bg-white text-sky-600 hover:bg-slate-50 hover:text-sky-700 font-bold px-8 py-3 text-lg shadow-lg rounded-full border-none">
                Contactar Ahora
              </Button>
            </a>
            {/* <Link to="/register">
              <Button variant="outline" size="lg" className="bg-sky-600/30 text-white border-white/30 hover:bg-sky-600/50 hover:border-white font-semibold px-8 py-3 text-lg rounded-full backdrop-blur-sm">
                Registrarse
              </Button>
            </Link> */}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="landing-footer" className="bg-slate-900 text-slate-300 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="bg-slate-800 p-2 rounded-full">
                  <Heart className="h-5 w-5 text-sky-400" />
                </div>
                <span className="text-xl font-bold tracking-wider text-white">GeriApp</span>
              </div>
              <p className="text-slate-400 leading-relaxed mb-6 text-sm">
                Comprometidos con el bienestar y la dignidad de nuestros adultos mayores, brindando cuidados de excelencia.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-6 text-white">Servicios</h3>
              <ul className="space-y-4 text-sm">
                <li className="hover:text-sky-400 transition-colors cursor-pointer">Estancia Permanente</li>
                <li className="hover:text-sky-400 transition-colors cursor-pointer">Centro de Día</li>
                <li className="hover:text-sky-400 transition-colors cursor-pointer">Rehabilitación</li>
                <li className="hover:text-sky-400 transition-colors cursor-pointer">Cuidados Especiales</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-6 text-white">Enlaces</h3>
              <ul className="space-y-4 text-sm">
                <li className="hover:text-sky-400 transition-colors cursor-pointer"><a href="https://casitademaria.com" target="_blank" rel="noopener noreferrer">Inicio</a></li>
                <li className="hover:text-sky-400 transition-colors cursor-pointer"><a href="https://casitademaria.com" target="_blank" rel="noopener noreferrer">Nosotros</a></li>
                <li className="hover:text-sky-400 transition-colors cursor-pointer"><a href="https://wa.me/529981519578" target="_blank" rel="noopener noreferrer">Contacto</a></li>
                <li className="hover:text-sky-400 transition-colors cursor-pointer"><Link to="/login">Portal Familiares</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-bold mb-6 text-white">Contacto</h3>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start">
                  <MapPin className="w-5 h-5 mr-3 text-sky-500 mt-0.5" />
                  <span>Av. Principal 123, Ciudad de México, CDMX</span>
                </li>
                <li className="flex items-center">
                  <Phone className="w-5 h-5 mr-3 text-sky-500" />
                  <span>9841979469</span>
                </li>
                <li className="flex items-center">
                  <Mail className="w-5 h-5 mr-3 text-sky-500" />
                  <span>contacto@geriapp.com</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-12 pt-8 text-center text-slate-500 text-xs">
            <p>&copy; {new Date().getFullYear()} GeriApp. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
