'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'uz' | 'ru';
type Theme = 'light' | 'dark';

export const translations = {
  uz: {
    searchPlaceholder: "Sariq va yangi mahsulotlarni qidirish...",
    cart: "Savat",
    adminPanel: "Admin panel",
    superAdmin: "Super Admin",
    profile: "Profil",
    login: "Kirish",
    logout: "Chiqish",
    welcome: "Xush kelibsiz!",
    categories: "Kategoriyalar",
    products: "Mahsulotlar",
    catalog: "Katalog",
    emptyCart: "Savat bo'sh",
    checkout: "Buyurtma berish",
    name: "Ism",
    phone: "Telefon raqami",
    address: "Manzil",
    comment: "Izoh",
    total: "Jami",
    backToHome: "Bosh sahifaga qaytish",
    searchResult: "Qidiruv natijalari",
    loginPhone: "Telefon raqami",
    loginPassword: "Parol",
    register: "Ro'yxatdan o'tish",
    repeatPassword: "Parolni takrorlang",
    smsOtp: "SMS kod orqali kirish",
    getOtp: "SMS kod olish",
    enterOtp: "SMS kodini kiriting",
    save: "Saqlash",
    theme: "Mavzu",
    language: "Til",
    openShop: "Do'konni ochish",
    viewOrders: "Buyurtmalarim",
    help: "Yordam",
    freshFoodDelivery: "Sariq va yangi mahsulotlarni uyingizga yetkazib beramiz!",
    bannerDesc: "Eng yaxshi sabzavotlar, mevalar, sut va ichimliklarni hoziroq buyurtma qiling. Toshkent bo'ylab tez yetkazish.",
    goToCatalog: "Katalogga o'tish",
    noProductsFound: "Mahsulotlar topilmadi",
    changeFilters: "Qidiruv so'rovi yoki kategoriyani o'zgartirib ko'ring.",
    inStock: "Mavjud",
    outOfStock: "Mavjud emas",
    lowStock: "Oz qoldi",
    addToCart: "Savatga qo'shish",
    alreadyInCart: "Savatda mavjud:",
    description: "Tavsif",
    specifications: "Xususiyatlari",
    barcode: "Shtrixkod",
    nomenclatureCode: "Nomenklatura kodi",
    unit: "O'lchov birligi",
    loading: "Yuklanmoqda...",
    contacts: "Kontaktlar",
    allRightsReserved: "Barcha huquqlar himoyalangan.",
  },
  ru: {
    searchPlaceholder: "Поиск свежих продуктов...",
    cart: "Корзина",
    adminPanel: "Админка",
    superAdmin: "Super Admin",
    profile: "Профиль",
    login: "Войти",
    logout: "Выйти",
    welcome: "Добро пожаловать!",
    categories: "Категории",
    products: "Товары",
    catalog: "Каталог продуктов",
    emptyCart: "Корзина пуста",
    checkout: "Оформить заказ",
    name: "Имя",
    phone: "Телефон",
    address: "Адрес",
    comment: "Комментарий",
    total: "Итого",
    backToHome: "На главную",
    searchResult: "Результаты поиска",
    loginPhone: "Номер телефона",
    loginPassword: "Пароль",
    register: "Регистрация",
    repeatPassword: "Повторите пароль",
    smsOtp: "Вход через SMS OTP",
    getOtp: "Получить код",
    enterOtp: "Введите код из SMS",
    save: "Сохранить",
    theme: "Тема",
    language: "Язык",
    openShop: "Открыть магазин",
    viewOrders: "Мои заказы",
    help: "Помощь",
    freshFoodDelivery: "Свежие продукты с доставкой на дом!",
    bannerDesc: "Заказывайте лучшие овощи, фрукты, молочные продукты и напитки прямо сейчас. Быстрая доставка в любую точку Ташкента.",
    goToCatalog: "Перейти к покупкам",
    noProductsFound: "Товары не найдены",
    changeFilters: "Попробуйте изменить запрос или категорию фильтрации.",
    inStock: "В наличии",
    outOfStock: "Нет в наличии",
    lowStock: "Мало осталось",
    addToCart: "Добавить в корзину",
    alreadyInCart: "Уже в корзине:",
    description: "Описание",
    specifications: "Характеристики",
    barcode: "Штрихкод",
    nomenclatureCode: "Код номенклатуры",
    unit: "Единица измерения",
    loading: "Загрузка...",
    contacts: "Контакты",
    allRightsReserved: "Все права защищены.",
  }
};

interface LanguageThemeContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  t: (key: keyof typeof translations['ru']) => string;
}

const LanguageThemeContext = createContext<LanguageThemeContextType | undefined>(undefined);

export function LanguageThemeProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ru');
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    // Read persisted state
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang === 'uz' || savedLang === 'ru') {
      setLanguageState(savedLang);
    }
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setThemeState(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    document.cookie = `language=${lang}; path=/; max-age=31536000`;
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    document.cookie = `theme=${newTheme}; path=/; max-age=31536000`;
  };

  const t = (key: keyof typeof translations['ru']) => {
    return translations[language][key] || translations['ru'][key] || String(key);
  };

  return (
    <LanguageThemeContext.Provider value={{ language, setLanguage, theme, setTheme, t }}>
      {children}
    </LanguageThemeContext.Provider>
  );
}

export function useLanguageTheme() {
  const context = useContext(LanguageThemeContext);
  if (!context) {
    throw new Error('useLanguageTheme must be used within a LanguageThemeProvider');
  }
  return context;
}
