import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart];

      const productExists = updatedCart.find(product => product.id === productId);

      const amount = productExists ? productExists.amount + 1 : 1;

      const amountStorage = await api.get<Stock>(`stock/${productId}`)
        .then(res => { return res.data.amount });

      if (amount > amountStorage) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      } else if (productExists) {
        productExists.amount = amount;
      } else {
        const product = await api.get<Product>(`products/${productId}`)
          .then(res => { return res.data });

        const newProduct = {
          ...product,
          amount: amount
        }

        updatedCart.push(newProduct);
      }

      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = [...cart];
      let filteredCart: Product[] = [];

      const productExists = updatedCart.find(product => product.id === productId);

      if (productExists) {
        filteredCart = updatedCart.filter(product => product.id !== productId)
        setCart(filteredCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(filteredCart));
      } else {
        throw Error();
      }

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      }
      const updatedCart = [...cart];
      const productExists = updatedCart.find(product => product.id === productId);

      const amountStorage = await api.get<Stock>(`stock/${productId}`)
        .then(res => { return res.data.amount });

      if (amount > amountStorage) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (productExists) {
        productExists.amount = amount;
        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      } else {
        throw Error();
      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
