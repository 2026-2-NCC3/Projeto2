package com.example.projetopi;

import android.content.Context;
import android.util.AttributeSet;
import android.view.View;
import android.view.ViewGroup;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.constraintlayout.widget.ConstraintLayout;
import androidx.constraintlayout.widget.ConstraintSet;

/**
 * ConstraintLayout para listas/ações cujos filhos são acrescentados em Java.
 * O modo horizontal é selecionado por android:tag="horizontal".
 * Preserva IDs, cliques, margens e as listas dinâmicas sem outra classe de organização.
 */
public final class ConstraintStackLayout extends ConstraintLayout {
    private boolean updating;

    public ConstraintStackLayout(Context context) { super(context); }
    public ConstraintStackLayout(Context context, @Nullable AttributeSet attrs) { super(context, attrs); }
    public ConstraintStackLayout(Context context, @Nullable AttributeSet attrs, int defStyleAttr) { super(context, attrs, defStyleAttr); }

    @Override
    public void onViewAdded(View child) {
        super.onViewAdded(child);
        applyStack();
    }

    @Override
    public void onViewRemoved(View child) {
        super.onViewRemoved(child);
        applyStack();
    }

    @Override
    protected void onAttachedToWindow() {
        super.onAttachedToWindow();
        applyStack();
    }

    private void applyStack() {
        if (updating) return;
        updating = true;
        try {
            boolean horizontal = "horizontal".equals(getTag());
            int total = getChildCount();
            if (total == 0) return;
            int[] ids = new int[total];
            for (int i = 0; i < total; i++) {
                View child = getChildAt(i);
                if (child.getId() == View.NO_ID) child.setId(View.generateViewId());
                ids[i] = child.getId();
            }
            for (int i = 0; i < total; i++) {
                View child = getChildAt(i);
                ViewGroup.LayoutParams current = child.getLayoutParams();
                if (current == null) current = new LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT);
                LayoutParams lp = current instanceof LayoutParams ? (LayoutParams) current : new LayoutParams(current);
                if (horizontal) {
                    // Botões da Agenda seguem pesos iguais; a largura passa a ser distribuída pelas constraints.
                    lp.width = 0;
                    lp.horizontalWeight = 1f;
                    lp.topToTop = ConstraintSet.PARENT_ID;
                    lp.bottomToBottom = ConstraintSet.PARENT_ID;
                    lp.startToStart = (i == 0) ? ConstraintSet.PARENT_ID : ConstraintSet.UNSET;
                    lp.startToEnd = (i > 0) ? ids[i-1] : ConstraintSet.UNSET;
                    lp.endToStart = (i < total - 1) ? ids[i+1] : ConstraintSet.UNSET;
                    lp.endToEnd = (i == total - 1) ? ConstraintSet.PARENT_ID : ConstraintSet.UNSET;
                    if (i == 0) lp.horizontalChainStyle = ConstraintSet.CHAIN_SPREAD;
                } else {
                    if (lp.width == LayoutParams.MATCH_PARENT) lp.width = 0;
                    lp.startToStart = ConstraintSet.PARENT_ID;
                    lp.endToEnd = ConstraintSet.PARENT_ID;
                    lp.topToTop = (i == 0) ? ConstraintSet.PARENT_ID : ConstraintSet.UNSET;
                    lp.topToBottom = (i > 0) ? ids[i - 1] : ConstraintSet.UNSET;
                    lp.bottomToTop = ConstraintSet.UNSET;
                    lp.bottomToBottom = (i == total - 1) ? ConstraintSet.PARENT_ID : ConstraintSet.UNSET;
                }
                child.setLayoutParams(lp);
            }
        } finally {
            updating = false;
        }
    }
}
